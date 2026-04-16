import type { ContactInfo } from '@/types'

type ContactSectionProps = {
  contact: ContactInfo
}

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <section
      className="flex min-h-[70vh] flex-col justify-center px-5 py-24 sm:px-8 lg:px-12"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto w-full max-w-xl">
        <h1
          id="contact-heading"
          className="font-display text-3xl font-normal tracking-[-0.02em] text-white sm:text-4xl"
        >
          Contact
        </h1>
        <p className="mt-8 text-sm leading-relaxed text-[var(--color-foreground-muted)]">
          For collaborations, treatments, and commissioning inquiries, reach out
          directly. Limited projects accepted each season.
        </p>

        <div className="mt-12 space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-foreground-muted)]">
              Email
            </p>
            <a
              href={`mailto:${contact.email}`}
              className="mt-2 inline-block text-sm text-white transition-opacity hover:opacity-80"
            >
              {contact.email}
            </a>
          </div>

          {contact.location ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-foreground-muted)]">
                Base
              </p>
              <p className="mt-2 text-sm text-white/90">{contact.location}</p>
            </div>
          ) : null}

          {contact.availabilityNote ? (
            <p className="text-xs leading-relaxed text-[var(--color-foreground-muted)]">
              {contact.availabilityNote}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
