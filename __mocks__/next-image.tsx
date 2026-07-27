import React from "react";

export default function Image(props: Record<string, unknown>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />;
}
