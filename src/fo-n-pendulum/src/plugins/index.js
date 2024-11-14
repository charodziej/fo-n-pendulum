/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
import konva from './konva'
import router from '@/router'
import pinia from '@/stores'

export function registerPlugins(app) {
    app.use(vuetify).use(router).use(pinia).use(konva, { prefix: 'Konva' })
}
