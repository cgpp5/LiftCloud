import './shared/device-polyfill'
import { BaseApp } from '@zeppos/zml/base-app'
import { log as Logger } from '@zos/utils'

const logger = Logger.getLogger('LiftCloud-app')

App(
  BaseApp({
    globalData: {},
    onCreate() {
      logger.log('LiftCloud app onCreate')
    },
    onDestroy() {
      logger.log('LiftCloud app onDestroy')
    }
  })
)
