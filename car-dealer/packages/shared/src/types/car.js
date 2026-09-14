/**
 * @typedef {'available_in_market'|'purchased'|'in_repair'|'listed_for_sale'|'sold'} CarState
 * @typedef {'poor'|'fair'|'good'} ConditionTier
 * @typedef {'old_man'|'private_owner'|'shady_dealer'|'enthusiast'|'urgent_sale'} SellerArchetype
 *
 * @typedef {Object} Car
 * @property {string} id
 * @property {string|null} player_id
 * @property {string} make
 * @property {string} model
 * @property {number} year
 * @property {number} mileage
 * @property {string} color
 * @property {ConditionTier} condition_tier
 * @property {CarState} state
 * @property {number} purchase_price        - BYN integer
 * @property {number|null} asking_price     - BYN integer
 * @property {number|null} final_sale_price - BYN integer
 * @property {SellerArchetype} seller_archetype
 * @property {string} market_listing_expires_at
 * @property {string} created_at
 * @property {string} updated_at
 */

export {};
