# Kleenest Owner

Kleenest Owner is the private Platform Owner control plane for the Kleenest ecosystem. It is not a customer-facing product and is not an App Store / Play Store product surface.

## Canonical repository contract

- **`Kleenest_Architecture/main`** is the canonical source for platform features, services, system information, product rules, data/provenance models, workflows and administrative requirements.
- **`Kleenest_Production`** is the live Consumer/Premium application and network counterpart.
- **`Kleenest_Business`** is the Business application runtime, including Growth and Business Enterprise capability layers.
- **`Kleenest_Fleet`** is the Fleet application runtime, including Fleet Enterprise upgrades.
- **`Kleenest_Owner`** owns only the private owner/control-plane implementation.

Owner must be able to communicate with and administer the whole system through canonical backend/admin contracts. It should understand Production, Business, Fleet and Enterprise entitlements without copying their customer-facing interfaces into Owner.

## Owner responsibilities

Owner should focus on platform-level work:

- organization provisioning and lifecycle;
- user/account administration;
- Business/Fleet subscription and entitlement administration;
- Enterprise upgrade/configuration controls;
- support and troubleshooting tooling;
- trust, safety and moderation;
- data/provenance operations;
- verification and contradiction handling;
- system health and operational status;
- platform audit trails;
- feature/configuration controls;
- integration administration;
- cross-network analytics and intelligence;
- platform-level notification/event visibility;
- billing/subscription state visibility where authorized.

## Product boundary

Owner does **not** contain replicas or preview versions of Consumer, Premium, Business, Fleet or Enterprise product screens. Product behavior is inspected through the actual product applications with authorized accounts.

Owner instead provides the authoritative cross-product control plane.

## Enterprise

Enterprise is not a fourth application. Owner manages and observes Enterprise entitlements that are enforced inside Business and Fleet.

Owner should be able to determine, at minimum:

- purchased Business plan;
- whether Business Standard is purchased or bundled through Fleet;
- Fleet entitlement state;
- Business Growth/Enterprise capability state;
- Fleet Enterprise state;
- Business active-location counts;
- Fleet monitored-location counts;
- organization memberships and scoped roles;
- effective capabilities resolved by the backend.

## Implementation rule

For every Owner implementation wave:

1. inspect `Kleenest_Architecture/main` for canonical system/admin behavior and contracts;
2. inspect Production, Business and Fleet backend-facing contracts when Owner needs to observe or administer those products;
3. implement Owner runtime code only in `Kleenest_Owner`;
4. use privileged backend/admin APIs with explicit Platform Owner authorization rather than bypassing application security assumptions;
5. preserve an audit trail for consequential Owner mutations;
6. treat RLS/RPC/server authorization as authoritative even though Owner is private.
