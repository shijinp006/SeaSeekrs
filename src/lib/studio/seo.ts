// The checks shown as green and amber badges in the studio

export const titleIssue = (title: string) =>
  !title ? "Title missing" : title.length < 30 ? "Title too short" : title.length > 60 ? "Title too long" : null;

export const descriptionIssue = (d: string) =>
  !d ? "Description missing" : d.length < 70 ? "Description too short" : d.length > 160 ? "Description too long" : null;

export const seoIssues = (seo: { title: string; description: string }) =>
  [titleIssue(seo.title), descriptionIssue(seo.description)].filter((x) => x !== null);

const weak = /^(image|photo|picture|img|dsc)?[\s_-]*\d*$|\.(jpe?g|png|webp|avif)$|^(image|photo|picture) of$/i;
export const altIssue = (alt: string) =>
  !alt.trim() ? "Missing" : weak.test(alt.trim()) || alt.trim().length < 5 ? "Too vague" : alt.length > 125 ? "Too long" : null;
