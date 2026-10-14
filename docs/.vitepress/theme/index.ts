import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import InteractiveDemo from './components/InteractiveDemo.vue'
import SchemaOrbit from './components/SchemaOrbit.vue'
import BrandMark from './components/BrandMark.vue'
import CompatibilityLogos from './components/CompatibilityLogos.vue'
import CapabilityScenarios from './components/CapabilityScenarios.vue'
import LlmToggle from './components/LlmToggle.vue'
import CopyCommand from './components/CopyCommand.vue'
import Icon from './components/Icon.vue'
import Status from './components/Status.vue'
import ArchitectureTree from './components/ArchitectureTree.vue'
import ProofStrip from './components/ProofStrip.vue'
import SequenceDiagram from './components/SequenceDiagram.vue'
import HttpArchitecture from './components/HttpArchitecture.vue'
import HeroProof from './components/HeroProof.vue'
import './style.css'
import './widgets.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('InteractiveDemo', InteractiveDemo)
    app.component('SchemaOrbit', SchemaOrbit)
    app.component('BrandMark', BrandMark)
    app.component('ProofStrip', ProofStrip)
    app.component('SequenceDiagram', SequenceDiagram)
    app.component('HttpArchitecture', HttpArchitecture)
    app.component('HeroProof', HeroProof)
    app.component('Icon', Icon)
    app.component('Status', Status)
    app.component('ArchitectureTree', ArchitectureTree)
    app.component('CompatibilityLogos', CompatibilityLogos)
    app.component('CapabilityScenarios', CapabilityScenarios)
    app.component('LlmToggle', LlmToggle)
    app.component('CopyCommand', CopyCommand)
  },
}
