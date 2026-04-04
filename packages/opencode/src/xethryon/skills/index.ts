/**
 * Xethryon Skills System — barrel exports.
 *
 * Entry point for the bundled skill registry and initialization.
 */

export {
  registerBundledSkill,
  getSkill,
  getAllSkills,
  getEnabledSkills,
  clearSkills,
  type BundledSkillDefinition,
  type RegisteredSkill,
} from "./registry.js"

export { initBundledSkills } from "./bundled/index.js"
