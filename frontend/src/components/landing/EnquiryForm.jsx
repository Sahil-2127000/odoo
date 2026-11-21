import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { submitEnquiry } from '@/api/public'
import { Input, Select } from '@/components/ui'
import SlabButton from './SlabButton'
import { EMPTY_ENQUIRY, KW_OPTIONS, SYSTEM_TYPES } from './landingData'

// Returns an object like { phone: 'Enter a 10-digit mobile number' }. Empty object = no errors.
function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Please enter your name'
  if (!/^\d{10}$/.test(form.phone)) errors.phone = 'Enter a 10-digit mobile number'
  if (!form.city.trim()) errors.city = 'Please enter your address or city'
  if (!form.monthlyBill || Number(form.monthlyBill) <= 0) errors.monthlyBill = 'Please enter your monthly bill'
  return errors
}

/**
 * Enquiry form -> POST /public/enquiry.
 * The form values (`form`, `setForm`) live in LandingPage, so a package card can fill in the size and type.
 */
export default function EnquiryForm({ form, setForm }) {
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('') // set after a successful submit

  function handleChange(e) {
    const { name, value } = e.target
    // The phone box keeps only digits (max 10), so "98765 43210" becomes "9876543210"
    const cleanValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    setForm({ ...form, [name]: cleanValue })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const foundErrors = validate(form)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length > 0) return

    setSending(true)
    setServerError('')
    try {
      // The backend only stores name, phone, city and a note,
      // so the size, system type and bill go into the note (nothing the customer typed is lost)
      const systemLabel = form.systemType === 'off_grid' ? 'Off-Grid' : 'On-Grid'
      const enquiry = await submitEnquiry({
        name: form.name.trim(),
        phone: form.phone,
        city: form.city.trim(),
        note: `Wants a ${form.capacityKw} kW ${systemLabel} system. Monthly bill about Rs ${form.monthlyBill}.`,
      })
      setReferenceNumber(enquiry.code) // e.g. EN-1004
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function startAgain() {
    setForm(EMPTY_ENQUIRY)
    setReferenceNumber('')
  }

  return (
    <section id="enquiry" className="scroll-mt-16 bg-slate-950 py-24 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        {/* Left side: text */}
        <div>
          <p className="text-sm font-semibold text-amber-300">Free quote</p>
          <h2 className="mt-2 font-display text-5xl leading-[0.9] font-extrabold text-white uppercase sm:text-7xl">
            Get your free <span className="font-serif font-normal text-amber-300 normal-case italic">solar quote.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-slate-300">
            Tell us a little about your home. Our team will call you within one working day to check
            your roof and book a free survey.
          </p>
          <ul className="mt-8 space-y-3 text-slate-300">
            <li>✓ No charges for the survey</li>
            <li>✓ Quote only after the roof survey is approved</li>
            <li>✓ We handle the subsidy paperwork</li>
          </ul>
        </div>

        {/* Right side: the form (or the success message) */}
        <div className="bg-white p-6 text-slate-700 sm:p-8">
          {referenceNumber ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-success-500" />
              <h3 className="mt-4 font-display text-4xl font-extrabold uppercase">Thank you! We got your enquiry.</h3>
              <p className="mt-2 text-slate-600">
                We will call {form.name} on {form.phone} about a {form.capacityKw} kW{' '}
                {form.systemType === 'on_grid' ? 'On-Grid' : 'Off-Grid'} system. Please keep this reference number:
              </p>
              <p className="mt-4 inline-block border-2 border-dashed border-success-500 px-6 py-3 font-mono text-2xl font-bold text-success-700">
                {referenceNumber}
              </p>
              <div className="mt-8">
                <SlabButton variant="dark" onClick={startAgain}>Send another enquiry</SlabButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />

              <Input
                label="Mobile number"
                name="phone"
                type="tel"
                placeholder="10-digit number"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
                required
              />

              <Input label="Address / City" name="city" value={form.city} onChange={handleChange} error={errors.city} required />

              <div className="grid gap-5 sm:grid-cols-2">
                <Select label="Required size" name="capacityKw" value={form.capacityKw} onChange={handleChange} options={KW_OPTIONS} />
                <Select label="System type" name="systemType" value={form.systemType} onChange={handleChange} options={SYSTEM_TYPES} />
              </div>

              <Input
                label="Monthly electricity bill (₹)"
                name="monthlyBill"
                type="number"
                placeholder="e.g. 4500"
                value={form.monthlyBill}
                onChange={handleChange}
                error={errors.monthlyBill}
                required
              />

              {serverError && <p className="text-sm text-danger-700">{serverError}</p>}

              <SlabButton type="submit" disabled={sending} className="w-full">
                {sending ? 'Sending…' : 'Send enquiry'}
              </SlabButton>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
