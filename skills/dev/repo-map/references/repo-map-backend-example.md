# Repo Map

## Component Summary

This service turns purchase requests into paid orders and queues fulfillment after payment is accepted.

## Project Glossary

| Term | Kind | Meaning In This Project | Not The Same As | Source |
|---|---|---|---|---|
| Order | domain | A purchase intent that can exist before payment succeeds. | Payment, Invoice | `orders/Order.ts`, `OrderService.test.ts` |
| Payment handoff | domain | The moment an order is linked to an external payment provider transaction. | Fulfillment, settlement | `payments/PaymentGateway.ts`, `create-order.integration.test.ts` |
| Fulfillment | domain | Internal work triggered after the paid order is accepted. | Payment capture, shipping label | `fulfillment/FulfillmentJob.ts` |
| Idempotency key | domain/code | Request identity used to avoid duplicate order/payment creation on retry. | Order ID | `IdempotencyStore.ts`, `retry.test.ts` |

## Working Map

### File Structure

| Path | Contains | Notes |
|---|---|---|
| `orders/` | Order model, service, repository | Owns order lifecycle state. |
| `payments/` | Payment gateway and provider client | Owns external payment transaction handoff. |
| `fulfillment/` | Fulfillment job and queue integration | Starts post-payment work. |
| `idempotency/` | Idempotency store and retry lookup | Maps repeated requests to existing work. |
| `tests/` | Lifecycle, retry, gateway, and fulfillment tests | Documents service behavior. |

### Modules

| Module | Location | Main Duties |
|---|---|---|
| Orders | `orders/` | Validate requests, create orders, and move orders through lifecycle states. |
| Payments | `payments/` | Create or recover external payment transactions. |
| Fulfillment | `fulfillment/` | Queue internal work for paid orders. |
| Idempotency | `idempotency/` | Reuse existing order/payment work for retried requests. |

### Key Types

| Type | Location | Main Duties | Main Collaborators |
|---|---|---|---|
| `OrderService` | `orders/OrderService.ts` | Create orders and coordinate lifecycle transitions. | `OrderRepository`, `PaymentGateway`, `IdempotencyStore` |
| `PaymentGateway` | `payments/PaymentGateway.ts` | Create or retrieve provider transactions. | provider client, config |
| `IdempotencyStore` | `idempotency/IdempotencyStore.ts` | Record request identities and return existing work for retries. | `OrderService` |
| `FulfillmentJob` | `fulfillment/FulfillmentJob.ts` | Convert paid orders into queued fulfillment work. | queue, order repository |
| `OrderRepository` | `orders/OrderRepository.ts` | Persist and read order lifecycle state. | database client |

### Core Flows

```text
Create order request
  -> IdempotencyStore checks request identity
  -> OrderService validates cart and creates pending order
  -> PaymentGateway creates provider transaction
  -> OrderService links payment handoff to order
```

```text
Payment success
  -> payment status accepted
  -> order marked paid
  -> FulfillmentJob queued
```
