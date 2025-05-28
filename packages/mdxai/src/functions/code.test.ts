import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { code } from './code'

describe('code', () => {
  it('should generate a function', async () => {
    const result = await code`a function that returns the sum of two numbers`
    expect(result.code).toMatchInlineSnapshot(`
      "export function add(a: number, b: number): number {
        return a + b
      }"
    `)
  })

  it('should should have JSDoc documentation', async () => {
    const result = await code`nth fibonacci number`
    expect(result.type).toMatchInlineSnapshot(`
      "/**
       * Calculates the nth Fibonacci number
       * @param n - The position of the Fibonacci number to calculate (0-indexed)
       * @returns The nth Fibonacci number
       * @throws Error if n is negative
       * @example
       * fibonacci(0) // returns 0
       * fibonacci(1) // returns 1
       * fibonacci(10) // returns 55
       */
      export function fibonacci(n: number): number"
    `)
  })

  it('should should have tests', async () => {
    const result = await code`nth fibonacci number`
    expect(result.tests).toMatchInlineSnapshot(`
      "describe('fibonacci', () => {
        it('should return 0 for n = 0', () => {
          expect(fibonacci(0)).toBe(0)
        })
        
        it('should return 1 for n = 1', () => {
          expect(fibonacci(1)).toBe(1)
        })
        
        it('should return correct Fibonacci numbers for small values', () => {
          expect(fibonacci(2)).toBe(1)
          expect(fibonacci(3)).toBe(2)
          expect(fibonacci(4)).toBe(3)
          expect(fibonacci(5)).toBe(5)
          expect(fibonacci(6)).toBe(8)
          expect(fibonacci(7)).toBe(13)
        })
        
        it('should return correct Fibonacci numbers for larger values', () => {
          expect(fibonacci(10)).toBe(55)
          expect(fibonacci(15)).toBe(610)
          expect(fibonacci(20)).toBe(6765)
        })
        
        it('should throw an error for negative numbers', () => {
          expect(() => fibonacci(-1)).toThrow('Input must be a non-negative integer')
          expect(() => fibonacci(-10)).toThrow('Input must be a non-negative integer')
        })
        
        it('should handle edge case of very large numbers', () => {
          expect(fibonacci(30)).toBe(832040)
          expect(fibonacci(40)).toBe(102334155)
        })
      })"
    `)
  })

  it('should pass tests', async () => {
    const result = await code`billing for stripe api consumption`
    console.log(result)
    expect(result).toMatchInlineSnapshot(`
      {
        "code": "export function calculateStripeBilling(
        consumption: StripeApiConsumption[],
        billingTier: BillingTier,
        periodStart: Date,
        periodEnd: Date
      ): BillingSummary {
        // Filter consumption records within the billing period
        const periodConsumption = consumption.filter(record => {
          const recordDate = new Date(record.timestamp)
          return recordDate >= periodStart && recordDate <= periodEnd
        })

        // Calculate metrics
        const totalCalls = periodConsumption.length
        const successfulCalls = periodConsumption.filter(record => record.success).length
        const failedCalls = totalCalls - successfulCalls
        
        const averageResponseTime = totalCalls > 0
          ? periodConsumption.reduce((sum, record) => sum + record.responseTime, 0) / totalCalls
          : 0

        // Calculate billing
        const overageCalls = Math.max(0, totalCalls - billingTier.includedCalls)
        const includedCalls = Math.min(totalCalls, billingTier.includedCalls)
        const basePrice = billingTier.basePrice
        const overageCharges = overageCalls * billingTier.overagePrice
        const totalAmount = basePrice + overageCharges

        // Get customer ID from first record or empty string
        const customerId = periodConsumption.length > 0 ? periodConsumption[0].customerId : ''

        return {
          customerId,
          periodStart,
          periodEnd,
          totalCalls,
          successfulCalls,
          failedCalls,
          averageResponseTime: Math.round(averageResponseTime),
          billingTier,
          includedCalls,
          overageCalls,
          basePrice,
          overageCharges,
          totalAmount
        }
      }",
        "tests": "describe('calculateStripeBilling', () => {
        const basicTier: BillingTier = {
          name: 'Basic',
          includedCalls: 1000,
          basePrice: 2900, // $29.00
          overagePrice: 10 // $0.10 per call
        }

        const proPier: BillingTier = {
          name: 'Pro',
          includedCalls: 10000,
          basePrice: 9900, // $99.00
          overagePrice: 5 // $0.05 per call
        }

        const periodStart = new Date('2024-01-01')
        const periodEnd = new Date('2024-01-31')

        it('should calculate billing for usage within included calls', () => {
          const consumption: StripeApiConsumption[] = [
            {
              id: '1',
              customerId: 'cus_123',
              endpoint: '/v1/charges',
              method: 'POST',
              timestamp: new Date('2024-01-15'),
              responseTime: 150,
              success: true,
              objectCount: 1
            },
            {
              id: '2',
              customerId: 'cus_123',
              endpoint: '/v1/customers',
              method: 'GET',
              timestamp: new Date('2024-01-20'),
              responseTime: 100,
              success: true,
              objectCount: 10
            }
          ]

          const result = calculateStripeBilling(consumption, basicTier, periodStart, periodEnd)

          expect(result.customerId).toBe('cus_123')
          expect(result.totalCalls).toBe(2)
          expect(result.successfulCalls).toBe(2)
          expect(result.failedCalls).toBe(0)
          expect(result.averageResponseTime).toBe(125)
          expect(result.includedCalls).toBe(2)
          expect(result.overageCalls).toBe(0)
          expect(result.basePrice).toBe(2900)
          expect(result.overageCharges).toBe(0)
          expect(result.totalAmount).toBe(2900)
        })

        it('should calculate overage charges correctly', () => {
          const consumption: StripeApiConsumption[] = Array.from({ length: 1500 }, (_, i) => ({
            id: \`\${i + 1}\`,
            customerId: 'cus_456',
            endpoint: '/v1/charges',
            method: 'POST',
            timestamp: new Date('2024-01-15'),
            responseTime: 100,
            success: true
          }))

          const result = calculateStripeBilling(consumption, basicTier, periodStart, periodEnd)

          expect(result.totalCalls).toBe(1500)
          expect(result.includedCalls).toBe(1000)
          expect(result.overageCalls).toBe(500)
          expect(result.basePrice).toBe(2900)
          expect(result.overageCharges).toBe(5000) // 500 * 10 cents
          expect(result.totalAmount).toBe(7900)
        })

        it('should handle mixed success and failed calls', () => {
          const consumption: StripeApiConsumption[] = [
            {
              id: '1',
              customerId: 'cus_789',
              endpoint: '/v1/charges',
              method: 'POST',
              timestamp: new Date('2024-01-10'),
              responseTime: 200,
              success: true
            },
            {
              id: '2',
              customerId: 'cus_789',
              endpoint: '/v1/charges',
              method: 'POST',
              timestamp: new Date('2024-01-11'),
              responseTime: 300,
              success: false
            },
            {
              id: '3',
              customerId: 'cus_789',
              endpoint: '/v1/customers',
              method: 'GET',
              timestamp: new Date('2024-01-12'),
              responseTime: 100,
              success: true
            }
          ]

          const result = calculateStripeBilling(consumption, basicTier, periodStart, periodEnd)

          expect(result.totalCalls).toBe(3)
          expect(result.successfulCalls).toBe(2)
          expect(result.failedCalls).toBe(1)
          expect(result.averageResponseTime).toBe(200)
        })

        it('should filter consumption records by billing period', () => {
          const consumption: StripeApiConsumption[] = [
            {
              id: '1',
              customerId: 'cus_123',
              endpoint: '/v1/charges',
              method: 'POST',
              timestamp: new Date('2023-12-31'), // Before period
              responseTime: 100,
              success: true
            },
            {
              id: '2',
              customerId: 'cus_123',
              endpoint: '/v1/charges',
              method: 'POST',
              timestamp: new Date('2024-01-15'), // Within period
              responseTime: 150,
              success: true
            },
            {
              id: '3',
              customerId: 'cus_123',
              endpoint: '/v1/charges',
              method: 'POST',
              timestamp: new Date('2024-02-01'), // After period
              responseTime: 200,
              success: true
            }
          ]

          const result = calculateStripeBilling(consumption, basicTier, periodStart, periodEnd)

          expect(result.totalCalls).toBe(1)
          expect(result.averageResponseTime).toBe(150)
        })

        it('should handle empty consumption array', () => {
          const result = calculateStripeBilling([], basicTier, periodStart, periodEnd)

          expect(result.customerId).toBe('')
          expect(result.totalCalls).toBe(0)
          expect(result.successfulCalls).toBe(0)
          expect(result.failedCalls).toBe(0)
          expect(result.averageResponseTime).toBe(0)
          expect(result.includedCalls).toBe(0)
          expect(result.overageCalls).toBe(0)
          expect(result.totalAmount).toBe(2900) // Base price only
        })

        it('should work with different billing tiers', () => {
          const consumption: StripeApiConsumption[] = Array.from({ length: 12000 }, (_, i) => ({
            id: \`\${i + 1}\`,
            customerId: 'cus_pro',
            endpoint: '/v1/charges',
            method: 'POST',
            timestamp: new Date('2024-01-15'),
            responseTime: 120,
            success: true
          }))

          const result = calculateStripeBilling(consumption, proPier, periodStart, periodEnd)

          expect(result.totalCalls).toBe(12000)
          expect(result.includedCalls).toBe(10000)
          expect(result.overageCalls).toBe(2000)
          expect(result.basePrice).toBe(9900)
          expect(result.overageCharges).toBe(10000) // 2000 * 5 cents
          expect(result.totalAmount).toBe(19900)
        })

        it('should handle consumption at exactly the included limit', () => {
          const consumption: StripeApiConsumption[] = Array.from({ length: 1000 }, (_, i) => ({
            id: \`\${i + 1}\`,
            customerId: 'cus_exact',
            endpoint: '/v1/charges',
            method: 'POST',
            timestamp: new Date('2024-01-15'),
            responseTime: 100,
            success: true
          }))

          const result = calculateStripeBilling(consumption, basicTier, periodStart, periodEnd)

          expect(result.totalCalls).toBe(1000)
          expect(result.includedCalls).toBe(1000)
          expect(result.overageCalls).toBe(0)
          expect(result.overageCharges).toBe(0)
          expect(result.totalAmount).toBe(2900)
        })
      })",
        "type": "/**
       * Represents a Stripe API consumption record
       */
      export interface StripeApiConsumption {
        /** Unique identifier for the consumption record */
        id: string
        /** Stripe customer ID */
        customerId: string
        /** API endpoint that was called */
        endpoint: string
        /** HTTP method used */
        method: 'GET' | 'POST' | 'PUT' | 'DELETE'
        /** Timestamp of the API call */
        timestamp: Date
        /** Response time in milliseconds */
        responseTime: number
        /** Whether the request was successful */
        success: boolean
        /** Number of objects returned or affected */
        objectCount?: number
      }

      /**
       * Billing tier configuration
       */
      export interface BillingTier {
        /** Name of the billing tier */
        name: string
        /** Maximum number of API calls included in this tier */
        includedCalls: number
        /** Base price for this tier in cents */
        basePrice: number
        /** Price per additional API call in cents */
        overagePrice: number
      }

      /**
       * Billing summary for a customer
       */
      export interface BillingSummary {
        /** Stripe customer ID */
        customerId: string
        /** Billing period start date */
        periodStart: Date
        /** Billing period end date */
        periodEnd: Date
        /** Total number of API calls made */
        totalCalls: number
        /** Number of successful API calls */
        successfulCalls: number
        /** Number of failed API calls */
        failedCalls: number
        /** Average response time in milliseconds */
        averageResponseTime: number
        /** Billing tier applied */
        billingTier: BillingTier
        /** Number of calls included in the base price */
        includedCalls: number
        /** Number of calls beyond the included amount */
        overageCalls: number
        /** Base price in cents */
        basePrice: number
        /** Overage charges in cents */
        overageCharges: number
        /** Total amount due in cents */
        totalAmount: number
      }

      /**
       * Calculates billing for Stripe API consumption based on usage and billing tiers
       * @param consumption - Array of API consumption records
       * @param billingTier - The billing tier to apply
       * @param periodStart - Start date of the billing period
       * @param periodEnd - End date of the billing period
       * @returns Billing summary for the customer
       */
      export function calculateStripeBilling(
        consumption: StripeApiConsumption[],
        billingTier: BillingTier,
        periodStart: Date,
        periodEnd: Date
      ): BillingSummary",
      }
    `)
  })
})
