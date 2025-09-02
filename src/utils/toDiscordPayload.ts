import { EmbedData, DEFAULT_ICON_URL, DEFAULT_IMAGE_URL } from '../state/embedStore';

export function toDiscordPayload(embed: EmbedData) {
  // Retorna payload listo. description se deja en raw markdown.
  const { title, description, url, timestamp, color, footer, author, thumbnail, image, fields } = embed;
  const cleanedThumb = (thumbnail?.url)? { thumbnail: { url: thumbnail.url } } : {};
  const cleanedImage = (image?.url)? { image: { url: image.url } } : {};
  // Incluir author si hay al menos name, url o icon_url
  const hasAuthor = author && (author.name || author.url || author.icon_url);
  const cleanedAuthor = hasAuthor ? { author: { ...(author?.name? { name: author.name }: {}), ...(author?.url? { url: author.url }: {}), ...(author?.icon_url? { icon_url: author.icon_url }: {}) } } : {};
  // Incluir footer si hay al menos text o icon_url
  const hasFooter = footer && (footer.text || footer.icon_url);
  const cleanedFooter = hasFooter ? { footer: { ...(footer?.text? { text: footer.text }: {}), ...(footer?.icon_url? { icon_url: footer.icon_url }: {}) } } : {};
  return {
    embeds: [
      {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(url ? { url } : {}),
        ...(timestamp ? { timestamp } : {}),
        ...(color ? { color } : {}),
        ...cleanedFooter,
        ...cleanedAuthor,
        ...cleanedThumb,
        ...cleanedImage,
        ...(fields?.length ? { fields: fields.map(f => ({ name: f.name, value: f.value, inline: f.inline })) } : {})
      }
    ]
  };
}
