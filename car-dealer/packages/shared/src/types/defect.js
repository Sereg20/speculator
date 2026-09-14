/**
 * @typedef {'minor'|'moderate'|'major'} DefectSeverity
 * @typedef {'body'|'engine'|'transmission'|'suspension'|'interior'|'electrics'} DefectCategory
 *
 * @typedef {Object} Defect
 * @property {string} id
 * @property {string} car_id
 * @property {string} defect_type          - matches key in defectTable constants
 * @property {DefectSeverity} severity
 * @property {DefectCategory} category
 * @property {boolean} is_revealed_to_player
 * @property {boolean} is_quick_fixed
 * @property {number} proper_repair_cost   - BYN integer
 * @property {number} quick_fix_cost       - BYN integer
 * @property {number} repair_time_minutes
 * @property {string} created_at
 */

export {};
