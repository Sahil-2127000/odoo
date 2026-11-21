import { useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import Hero from '@/components/landing/Hero'
import Packages from '@/components/landing/Packages'
import HowItWorks from '@/components/landing/HowItWorks'
import SubsidyAndTrust from '@/components/landing/SubsidyAndTrust'
import Faq from '@/components/landing/Faq'
import EnquiryForm from '@/components/landing/EnquiryForm'
import { EMPTY_ENQUIRY } from '@/components/landing/landingData'

// Public home page ( / ). Each section is its own small component.
export default function LandingPage() {
  // Enquiry form values are kept here so a package card can fill in the size and type
  const [enquiry, setEnquiry] = useState(EMPTY_ENQUIRY)

  function handleSelectKit(kit) {
    setEnquiry({ ...enquiry, capacityKw: kit.capacityKw, systemType: kit.type })
    document.getElementById('enquiry').scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <Packages onSelect={handleSelectKit} />
      <HowItWorks />
      <SubsidyAndTrust />
      <Faq />
      <EnquiryForm form={enquiry} setForm={setEnquiry} />
      <Footer />
    </div>
  )
}
