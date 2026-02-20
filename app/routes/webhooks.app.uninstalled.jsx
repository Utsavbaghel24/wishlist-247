import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop } = await authenticate.webhook(request);

  await prisma.session.deleteMany({
    where: { shop },
  });

  return new Response(null, { status: 200 });
};