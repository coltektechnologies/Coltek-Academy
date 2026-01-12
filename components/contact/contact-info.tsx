import { Mail, Phone, MapPin, Clock } from "lucide-react"

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    details: "support@edulearn.com",
    description: "We respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    details: "+1 (555) 123-4567",
    description: "Mon-Fri, 9am-6pm EST",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    details: "123 Education Lane",
    description: "San Francisco, CA 94102",
  },
  {
    icon: Clock,
    title: "Office Hours",
    details: "Monday - Friday",
    description: "9:00 AM - 6:00 PM EST",
  },
]

export function ContactInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Contact Information</h2>
        <p className="text-muted-foreground">
          Choose the most convenient way to reach us. Our support team is always ready to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contactMethods.map((method) => (
          <div key={method.title} className="bg-card border border-border rounded-xl p-5">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <method.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
            <p className="text-foreground text-sm">{method.details}</p>
            <p className="text-muted-foreground text-xs mt-1">{method.description}</p>
          </div>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="bg-secondary/50 border border-border rounded-xl overflow-hidden h-64 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Interactive map would go here</p>
        </div>
      </div>
    </div>
  )
}
