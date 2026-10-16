import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactMessageSchema, type ContactMessageInput } from "@forth-urban/validation";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { Button, Input, Textarea, Label } from "@forth-urban/ui";
import { Accordion, type AccordionItemData } from "../../../components/accordion";
import { useSeo } from "../../../lib/use-seo";
import { useSubmitContact } from "../marketing-api";

const FAQ_ITEMS: AccordionItemData[] = [
  {
    id: "faq-1",
    question: "What documents do I receive when I purchase a property?",
    answer:
      "Every Forth Urban property comes with verified FCDA R-of-O (Right of Occupancy) or C-of-O (Certificate of Occupancy) certificates, Deed of Assignment, Registered Survey Plan with coordinates, and a formal Letter of Allocation ensuring secure and indisputable ownership.",
  },
  {
    id: "faq-2",
    question: "Do you offer flexible payment plans?",
    answer:
      "Yes. We offer structured installment financing with periods typically ranging from 6 to 12 months with low initial commitments. You can model your exact payments using our online budget and installment calculators.",
  },
  {
    id: "faq-3",
    question: "Can I inspect the properties physically or virtually before buying?",
    answer:
      "Absolutely. We conduct guided physical site inspections Monday through Saturday. For diaspora clients and remote buyers, we offer live interactive virtual video walkthroughs with real-time GPS coordinate confirmation.",
  },
  {
    id: "faq-4",
    question: "What makes Forth Urban locations special?",
    answer:
      "Our estates are strategically positioned in high-velocity Abuja growth corridors (such as Guzape II and Kuje) with verified government infrastructure planning, tarred arterial roads, and proven 15%+ historic annual capital appreciation.",
  },
  {
    id: "faq-5",
    question: "How do I start the property purchase process?",
    answer:
      "Start by taking our free AI Readiness Quiz to discover your tailored recommendations, or book a site inspection directly. Once you choose a plot, our legal team issues an offer letter and guides you through title verification and payment milestones.",
  },
  {
    id: "faq-6",
    question: "Are your properties suitable for immediate residential construction?",
    answer:
      "Yes. Our serviced estates feature cleared topography, boundary beacon demarcations, and planned road/drainage networks, enabling you to commence architectural planning and construction upon allocation.",
  },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const submitContactMutation = useSubmitContact();

  useSeo({
    title: "Contact Us & Frequently Asked Questions",
    description:
      "Get in touch with Forth Urban Limited in Jabi, Abuja. Call our team, send an inquiry, or read answers to common land ownership and title questions.",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      reason: "buying",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await submitContactMutation.mutateAsync(data);
      setSubmitted(true);
      reset();
    } catch {
      // Error handled by mutation state
    }
  });

  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      {/* Page Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#5C4033]/10 px-4 py-1.5 text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-4">
          <MessageSquare className="h-4 w-4" />
          Get In Touch
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[#181818] tracking-tight">
          Let’s Talk Real Estate
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-[#181818]/75 leading-relaxed">
          From first-time buyers to diaspora investors, we’re here to make your Abuja property journey smooth, secure, and rewarding.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column (5 cols): Contact Information Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-3xl liquid-glass p-8 shadow-md">
              <h2 className="font-heading text-xl font-bold text-[#181818] mb-6">
                Direct Contact Channels
              </h2>

              <div className="flex flex-col gap-6 text-sm">
                <a
                  href="tel:+2349111658936"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/80 hover:bg-white/80 transition group"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5C4033] text-white shadow-sm group-hover:scale-105 transition">
                    <Phone className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-[#181818]">Call or WhatsApp</div>
                    <div className="text-xs text-[#181818]/60 mt-0.5">Mon – Fri (8:00 – 17:00)</div>
                    <div className="font-semibold text-[#5C4033] mt-1 text-sm">+234 911 165 8936</div>
                  </div>
                </a>

                <a
                  href="mailto:info@forthurban.com"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/80 hover:bg-white/80 transition group"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5C4033] text-white shadow-sm group-hover:scale-105 transition">
                    <Mail className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-[#181818]">Email Inquiries</div>
                    <div className="text-xs text-[#181818]/60 mt-0.5">Quick 24h response time</div>
                    <div className="font-semibold text-[#5C4033] mt-1 text-sm">info@forthurban.com</div>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/80">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5C4033] text-white shadow-sm">
                    <MapPin className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-[#181818]">Headquarters</div>
                    <div className="text-xs text-[#181818]/70 mt-1 leading-relaxed">
                      19 Ali Baba Cres, Jabi, Abuja 900108, Federal Capital Territory, Nigeria
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/80">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5C4033] text-white shadow-sm">
                    <Clock className="h-5 w-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-[#181818]">Working Hours</div>
                    <div className="text-xs text-[#181818]/70 mt-1">
                      Monday to Friday: 8:00 AM – 5:00 PM<br />
                      Saturday: Site Inspections by Appointment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Send a Message Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl liquid-glass p-8 sm:p-10 shadow-xl border-white/80">
              <h2 className="font-heading text-2xl font-bold text-[#181818] mb-2">
                Send Us a Message
              </h2>
              <p className="text-sm text-[#181818]/70 mb-8">
                Fill out the form below. Our property consultation team will review your inquiry and follow up promptly.
              </p>

              {submitted ? (
                <div className="rounded-2xl bg-[#5C4033]/10 border border-[#5C4033]/20 p-8 text-center animate-in fade-in">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5C4033] text-white mb-4">
                    <CheckCircle2 className="h-8 w-8 text-[#d4af37]" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-[#181818] mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-sm text-[#181818]/80 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out. We have sent a confirmation copy to your email address and our team will get back to you shortly.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setSubmitted(false)}
                    className="mt-6"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
                  {/* Honeypot field for bot spam */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    {...register("companyWebsite")}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="name" className="text-xs font-bold text-[#181818]">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g. Chukwudi Okafor"
                        className="bg-white/60 border-white/80"
                        {...register("name")}
                      />
                      {errors.name && (
                        <span className="text-xs text-red-600">{errors.name.message}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-[#181818]">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="bg-white/60 border-white/80"
                        {...register("email")}
                      />
                      {errors.email && (
                        <span className="text-xs text-red-600">{errors.email.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="phone" className="text-xs font-bold text-[#181818]">
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        className="bg-white/60 border-white/80"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <span className="text-xs text-red-600">{errors.phone.message}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="reason" className="text-xs font-bold text-[#181818]">
                        Reason for Contact *
                      </Label>
                      <select
                        id="reason"
                        className="h-11 rounded-xl border border-white/80 bg-white/60 px-3 text-sm text-[#181818] shadow-sm focus:border-[#5C4033] focus:outline-none focus:ring-1 focus:ring-[#5C4033]"
                        {...register("reason")}
                      >
                        <option value="buying">Land Acquisition / Buying Inquiries</option>
                        <option value="site-inspection">Book / Inquire About Site Inspection</option>
                        <option value="general">General Advisory Question</option>
                        <option value="partnership">Development / Partnership</option>
                        <option value="other">Other Inquiry</option>
                      </select>
                      {errors.reason && (
                        <span className="text-xs text-red-600">{errors.reason.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="message" className="text-xs font-bold text-[#181818]">
                      Your Message *
                    </Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about the property, location, or guidance you need..."
                      className="bg-white/60 border-white/80 resize-none"
                      {...register("message")}
                    />
                    {errors.message && (
                      <span className="text-xs text-red-600">{errors.message.message}</span>
                    )}
                  </div>

                  {submitContactMutation.isError && (
                    <div className="rounded-xl bg-red-50 p-3 border border-red-200 flex items-center gap-2 text-xs text-red-700">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>An error occurred while sending your message. Please try again or call us directly.</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full justify-center gap-2 !bg-[#5C4033] hover:!bg-[#463026] mt-2 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? "Sending Message..." : "Send Message"}</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section with Animated Accordions */}
        <div className="mt-28">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#5C4033]/10 px-4 py-1.5 text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-3">
              <HelpCircle className="h-4 w-4" />
              Frequently Asked Questions
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-[#181818]">
              Got Questions? We Have Answers.
            </h2>
            <p className="mt-3 text-sm text-[#181818]/70">
              Clear answers to the most common questions regarding documentation, inspections, and purchasing land in Abuja.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion items={FAQ_ITEMS} defaultOpenId="faq-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
