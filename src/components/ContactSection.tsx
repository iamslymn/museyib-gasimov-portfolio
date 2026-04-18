import type { ContactInfo } from '@/types'

type ContactSectionProps = {
  contact: ContactInfo
}

function PhoneIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.09 1.18 2 2 0 012.08 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.11 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ContactSection({ contact }: ContactSectionProps) {

  return (
    <section
        className="flex min-h-[calc(100vh-108px)] flex-col justify-center px-5 py-16 sm:px-8 lg:px-12"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-16 xl:gap-24 items-center">

            {/* Left column: Portrait */}
            <div className="w-full">
              {contact.portraitUrl ? (
                <img
                  src={contact.portraitUrl}
                  alt="Museyib Gasimov"
                  className="w-full max-w-[500px] aspect-[3/4] object-cover object-top"
                />
              ) : (
                /*
                 * Portrait placeholder — replace by setting `portraitUrl` in src/data/contact.ts
                 * once the image is uploaded to Supabase Storage or another CDN.
                 */
                <div className="w-full max-w-[500px] aspect-[3/4] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]" />
              )}
            </div>

            {/* Right column: Bio + contact details */}
            <div className="flex flex-col">
              <h1
                id="contact-heading"
                className="font-display text-2xl font-normal tracking-[-0.02em] text-white sm:text-3xl"
              >
                Contact
              </h1>

              <p className="mt-7 text-sm leading-[1.85] text-[var(--color-foreground-muted)] max-w-[420px]">
                Baku-based filmmaker working with both real footage and
                AI-generated visuals. I combine storytelling with new
                technologies to create distinctive cinematic experiences. Open
                to collaborations, commissions, and creative partnerships. Feel
                free to reach out to discuss ideas or projects.
              </p>

              <div className="mt-10 space-y-5">
                {/* Phone */}
                {contact.phone && (
                  <div className="flex items-center gap-3.5">
                    <span className="text-[var(--color-foreground-muted)] shrink-0 mt-px">
                      <PhoneIcon />
                    </span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm text-white/75 transition-opacity hover:opacity-60"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                <div className="flex items-center gap-3.5">
                  <span className="text-[var(--color-foreground-muted)] shrink-0 mt-px">
                    <EmailIcon />
                  </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-white/75 transition-opacity hover:opacity-60"
                  >
                    {contact.email}
                  </a>
                </div>

                {/* Instagram */}
                {contact.instagram && (
                  <div className="flex items-center gap-3.5">
                    <span className="text-[var(--color-foreground-muted)] shrink-0 mt-px">
                      <InstagramIcon />
                    </span>
                    <a
                      href={
                        contact.instagramUrl ??
                        `https://www.instagram.com/${contact.instagram}/`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/75 transition-opacity hover:opacity-60"
                    >
                      {contact.instagram}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </section>
  )
}
