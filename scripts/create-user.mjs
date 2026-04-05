import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wjglrekxdmbsylrinvpl.supabase.co",
  "your_anon_key_here"
);

const username = "J";
const password = "28";
const hash = await bcrypt.hash(password, 10);

const { error } = await supabase.from("users").insert({
  username,
  password_hash: hash,
});

if (error) console.error("Error:", error);
else console.log("User created successfully!");