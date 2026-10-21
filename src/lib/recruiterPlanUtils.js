export function unwrapRecruiterResponse(payload) {
  let value = payload
  for (let depth = 0; depth < 5 && value && !Array.isArray(value); depth += 1) {
    if (value.data && typeof value.data === 'object') value = value.data
    else if (value.result && typeof value.result === 'object') value = value.result
    else break
  }
  return value
}

export function normalizeRecruiterPlans(payload) {
  const root = unwrapRecruiterResponse(payload)
  const rawList = Array.isArray(root) ? root : root?.plans ?? root?.planOptions ?? root?.plan_options ?? root?.items ?? root?.results ?? root?.records
  const plans = Array.isArray(rawList) ? rawList : rawList?.items ?? rawList?.results
  if (!Array.isArray(plans)) throw new Error('The /recruiter/plans response did not contain a plans list.')
  const normalizePlan = (plan) => ({
    ...plan,
    id: plan.id ?? plan.planId ?? plan.plan_id,
    name: plan.name ?? plan.planName ?? plan.plan_name ?? 'Hiring plan',
    price: plan.price ?? plan.amount ?? plan.priceAmount ?? plan.price_amount,
    currency: plan.currency ?? plan.priceCurrency ?? plan.price_currency,
    billingInterval: plan.billingInterval ?? plan.billing_interval ?? plan.interval,
    credits: plan.credits ?? plan.candidateCredits ?? plan.candidate_credits,
    jobPosts: plan.jobPosts ?? plan.job_posts,
    recruiterSeats: plan.recruiterSeats ?? plan.recruiter_seats,
    validityDays: plan.validityDays ?? plan.validity_days,
    features: Array.isArray(plan.features) ? plan.features : plan.features ? [plan.features] : [],
  })
  return {
    plans: plans.filter(Boolean).map(normalizePlan),
    currentPlan: root?.currentPlan ?? root?.current_plan ?? root?.currentSubscription?.plan ?? root?.current_subscription?.plan ?? root?.plan ?? null,
  }
}

export function normalizeRecruiterCredits(payload) {
  const root = unwrapRecruiterResponse(payload)
  const sources = [root?.creditBalance, root?.credit_balance, root?.balance, root?.credits, root]
  for (const source of sources) {
    const value = typeof source === 'number' || typeof source === 'string'
      ? source
      : source?.available ?? source?.availableCredits ?? source?.available_credits ?? source?.creditsAvailable ?? source?.credits_available ?? source?.remaining
    if (value !== undefined && value !== null && value !== '') {
      const available = Number(value)
      if (Number.isFinite(available)) return { ...(typeof root === 'object' && root ? root : {}), available }
    }
  }
  return null
}
