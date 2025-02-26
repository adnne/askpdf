import { createClient } from "../../../utils/supabase/server";
import { redirect } from "next/navigation";



export default async function PublicRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getSession()
  if (data?.session?.user) {
    redirect('/chat')
  }
  

  return (
    <div>
        {children}
    </div>
  );
}
