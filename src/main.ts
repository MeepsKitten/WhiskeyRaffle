import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#9b00ff',     // Purple
          secondary: '#d5b200',   // Gold
          accent: '#dc44d4',      // Pink
          background: '#121212',  // Dark background
          surface: '#1e1e1e',     // Dark surface
          'on-background': '#ffffff',
          'on-surface': '#ffffff',
        }
      }
    }
  }
})

createApp(App).use(vuetify).mount('#app')
