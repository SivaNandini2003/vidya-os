export default function handler(req: any, res: any) {
  res.status(200).json({ status: "alive", message: "Vercel function is booting without Prisma!" });
}
