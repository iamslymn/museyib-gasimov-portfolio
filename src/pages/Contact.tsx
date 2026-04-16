import { ContactSection } from '@/components/ContactSection'
import { contactInfo } from '@/data'

export function Contact() {
  return (
    <div className="flex flex-1 flex-col bg-black">
      <ContactSection contact={contactInfo} />
    </div>
  )
}
