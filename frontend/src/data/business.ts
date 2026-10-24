export const PLACEHOLDER = "[PLACEHOLDER]";

export const business = {
  name: "Good News Plastering",
  owner: "Darren Goodchild",
  ownerFirstName: "Darren",
  phone: {
    display: "07456 182265",
    tel: "+447456182265",
  },
  whatsapp: "447456182265",
  email: "dazlan73@gmail.com" as string,
} as const;

export const telHref = `tel:${business.phone.tel}`;
