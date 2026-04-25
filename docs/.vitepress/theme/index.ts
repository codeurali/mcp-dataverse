import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import InteractiveDemo from './components/InteractiveDemo.vue'
import HeroStats from './components/HeroStats.vue'
import CompatibilityLogos from './components/CompatibilityLogos.vue'
import ToolsShowcase from './components/ToolsShowcase.vue'
import CapabilityScenarios from './components/CapabilityScenarios.vue'
import LlmToggle from './components/LlmToggle.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('InteractiveDemo', InteractiveDemo)
    app.component('HeroStats', HeroStats)
    app.component('CompatibilityLogos', CompatibilityLogos)
    app.component('ToolsShowcase', ToolsShowcase)
    app.component('CapabilityScenarios', CapabilityScenarios)
    app.component('LlmToggle', LlmToggle)
  },
}
