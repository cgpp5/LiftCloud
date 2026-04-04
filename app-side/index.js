import { BaseSideService } from '@zeppos/zml/base-side'
import { BUILD_TAG } from '../shared/build-tag'

// ---------------------------------------------------------
// 1. CONFIGURACIÓN SUPABASE
// ---------------------------------------------------------
const SUPABASE_URL = "https://yfcvszwimcxakjnbqcwy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmY3ZzendpbWN4YWtqbmJxY3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzE0MjYsImV4cCI6MjA4MzY0NzQyNn0.q2utV8wJaSB4rmFbY06sffvbB_CRuZkrI7v2G8m-z3E"; 
const TABLE_NAME = "workout_logs";

// Build marker (used to verify the packaged side bundle is up-to-date)
const SIDE_MARKER = "LC_SIDE_2026-02-22.2";

// ---------------------------------------------------------
// 1.1. HELPERS (REINTENTOS / WARMUP)
// ---------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, { retries = 2, retryDelayMs = 800 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Si el servidor respondió, no reintentar 4xx (suele ser key/RLS/schema)
      if (response && response.status >= 400 && response.status < 500) {
        return response;
      }

      // 2xx/3xx OK o 5xx: devolvemos para que el caller decida, pero
      // hacemos retry ante 5xx (arranque en frío / proyecto recién reanudado).
      if (response && response.status >= 500 && attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError;
}

// ---------------------------------------------------------
// 2. FUNCIONES DE NEGOCIO
// ---------------------------------------------------------

/**
 * Calcula puntuación usando fórmula Epley (1RM estimado)
 */
function calculateScore(weight, reps) {
  if (reps === 0) return 0;
  return Number((weight * (1 + reps / 30)).toFixed(2));
}

/**
 * Envía datos a Supabase
 */
async function sendToSupabase(data) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`;
  
  console.log(`Enviando a Supabase: ${JSON.stringify(data)}`);
  
  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(data),
  }, { retries: 3, retryDelayMs: 900 });

  console.log(`Response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`Error HTTP: ${response.status} - ${errorText}`);
    return false;
  }

  console.log(`Insertado en Supabase correctamente`);
  return true;
}

// ---------------------------------------------------------
// 3. HANDLERS (usando patron req, res)
// ---------------------------------------------------------

async function handleSyncPending(req, res) {
  const { sets } = req.params || {};
  
  console.log(">>> handleSyncPending llamado");
  
  if (!sets || !Array.isArray(sets) || sets.length === 0) {
    console.log("No hay sets para sincronizar");
    return res(null, { status: "error", msg: "No hay sets" });
  }
  
  console.log(`Sincronizando ${sets.length} sets...`);
  
  let successCount = 0;
  let failedIds = [];
  
  for (const set of sets) {
    console.log(`-> ${set.exercise}: ${set.weight}kg x ${set.reps}`);
    try {
      const score = calculateScore(set.weight, set.reps);
      const payload = {
        exercise_name: set.exercise,
        weight: set.weight,
        reps: set.reps,
        score: score
      };
      
      const success = await sendToSupabase(payload);
      if (success) {
        successCount++;
      } else {
        failedIds.push(set.localId);
      }
    } catch(e) {
      console.log(`Error: ${e}`);
      failedIds.push(set.localId);
    }
  }
  
  console.log(`Completado: ${successCount}/${sets.length} exitosos`);
  res(null, { 
    status: "success", 
    synced: successCount, 
    failed: failedIds 
  });
}

async function handleLogExercise(req, res) {
  const { exercise, weight, reps } = req.params || {};

  if (!exercise || weight === undefined || reps === undefined) {
    return res(null, { status: "error", msg: "Datos incompletos" });
  }

  const score = calculateScore(weight, reps);
  console.log(`Score: ${score} para ${exercise}`);

  const payload = {
    exercise_name: exercise,
    weight: weight,
    reps: reps,
    score: score
  };

  try {
    const success = await sendToSupabase(payload);
    
    if (success) {
      res(null, { status: "success", score: score });
    } else {
      res(null, { status: "error", msg: "Error en Supabase" });
    }
  } catch (error) {
    console.log("Error de red:", error);
    res(null, { status: "offline", msg: "Sin conexión" });
  }
}

async function handleSyncExercises(req, res) {
  const { exercises } = req.params || {};
  
  console.log(">>> handleSyncExercises llamado");
  
  if (!exercises || !Array.isArray(exercises)) {
    return res(null, { status: "error", msg: "Lista invalida" });
  }
  
  console.log(`Sincronizando ${exercises.length} ejercicios...`);
  
  try {
    const deleteUrl = `${SUPABASE_URL}/rest/v1/exercises?name=neq.null`;
    await fetchWithRetry(deleteUrl, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    }, { retries: 2, retryDelayMs: 900 });
    
    const insertUrl = `${SUPABASE_URL}/rest/v1/exercises`;
    const data = exercises.map((item) => {
      if (typeof item === "string") {
        return { name: item };
      }

      const name = (item && item.name) ? String(item.name) : "";
      const defaultWeight = item && item.defaultWeight !== undefined ? Number(item.defaultWeight) : null;
      const defaultReps = item && item.defaultReps !== undefined ? Number(item.defaultReps) : null;

      return {
        name,
        default_weight: Number.isFinite(defaultWeight) ? defaultWeight : null,
        default_reps: Number.isFinite(defaultReps) ? defaultReps : null
      };
    });
    
    const response = await fetchWithRetry(insertUrl, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(data)
    }, { retries: 3, retryDelayMs: 900 });
    
    if (response.ok) {
      console.log(`${exercises.length} ejercicios sincronizados`);
      res(null, { status: "success", synced: exercises.length });
    } else {
      const errorText = await response.text();
      console.log(`Error: ${errorText}`);
      res(null, { status: "error", msg: errorText });
    }
  } catch(e) {
    console.log(`Error sync ejercicios: ${e}`);
    res(null, { status: "error", msg: String(e) });
  }
}

async function handleDeleteExercise(req, res) {
  const { name } = req.params || {};
  
  console.log(`>>> handleDeleteExercise: ${name}`);
  
  if (!name) {
    return res(null, { status: "error", msg: "Nombre requerido" });
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/exercises?name=eq.${encodeURIComponent(name)}`;
    const response = await fetchWithRetry(url, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    }, { retries: 2, retryDelayMs: 900 });
    
    if (response.ok) {
      console.log(`Ejercicio eliminado: ${name}`);
      res(null, { status: "success" });
    } else {
      res(null, { status: "error", msg: "Error eliminando" });
    }
  } catch(e) {
    console.log(`Error: ${e}`);
    res(null, { status: "error", msg: String(e) });
  }
}

async function handleGetExercises(req, res) {
  console.log(">>> handleGetExercises");
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=name,default_weight,default_reps&order=name`;
    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    }, { retries: 2, retryDelayMs: 900 });
    
    if (response.ok) {
      const data = await response.json();
      const exercises = data.map((e) => ({
        name: e.name,
        defaultWeight: e.default_weight,
        defaultReps: e.default_reps
      }));
      console.log(`${exercises.length} ejercicios obtenidos`);
      res(null, { status: "success", exercises });
    } else {
      res(null, { status: "error", msg: "Error obteniendo" });
    }
  } catch(e) {
    console.log(`Error: ${e}`);
    res(null, { status: "error", msg: String(e) });
  }
}

// ---------------------------------------------------------
// 4. SERVICIO PRINCIPAL (BaseSideService pattern - API 4.x)
// ---------------------------------------------------------

AppSideService(
  BaseSideService({
    onInit() {
      console.log("========================================");
      console.log("LiftCloud Side Service INICIADO (zml)");
      console.log(`Side marker: ${SIDE_MARKER} | build: ${BUILD_TAG}`);
      console.log("========================================");
    },

    onRequest(req, res) {
      console.log("REQUEST recibido:", JSON.stringify(req));

      const method = req.method;

      if (method === 'PING') {
        return res(null, { status: 'success', buildTag: BUILD_TAG, marker: SIDE_MARKER });
      }

      if (method === 'SYNC_PENDING') {
        handleSyncPending(req, res);
      } else if (method === 'LOG_EXERCISE') {
        handleLogExercise(req, res);
      } else if (method === 'SYNC_EXERCISES') {
        handleSyncExercises(req, res);
      } else if (method === 'DELETE_EXERCISE') {
        handleDeleteExercise(req, res);
      } else if (method === 'GET_EXERCISES') {
        handleGetExercises(req, res);
      } else {
        console.log(`Metodo desconocido: ${method}`);
        res(null, { status: "error", msg: "Metodo desconocido" });
      }
    },

    onRun() {},
    
    onDestroy() {
      console.log("LiftCloud Side Service DESTRUIDO");
    }
  })
)