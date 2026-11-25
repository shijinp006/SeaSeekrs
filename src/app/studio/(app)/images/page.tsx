import type { Metadata } from "next";
import Heading from "@/components/studio/Heading";
import ImageList from "@/components/studio/ImageList";

import { requireUser } from "@/lib/server/session";
import { getMedia } from "@/lib/server/studio";

export const instant = false;
export const metadata: Metadata = { title: "Images & Alt Text" };

export default async function Images() {
  await requireUser();
  
  return (
    <>
      <Heading title="Images & Alt Text" text="Alt text tells Google and screen readers what a picture shows. Upload new pictures here, then choose them in a section or a post." />
      <ImageList items={await getMedia()} />
    </>
  );
}
