// Run: node --env-file=.env.local --import tsx src/db/seed.ts
import { auth } from "../lib/auth";

async function main() {
  const email = process.argv[2] || "admin@celectronics.com";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    });
    console.log(`✓ Admin created: ${email}`);
  } catch (e: any) {
    console.log(`Already exists or error: ${e.message}`);
  }
}

main();
