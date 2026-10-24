export interface Testimonial {
  quote: string;
  name: string;
  place?: string;
}

export const testimonialsEnabled = false;

export const testimonials: Testimonial[] = [];
