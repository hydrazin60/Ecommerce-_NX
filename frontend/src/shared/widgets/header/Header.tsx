import { Input } from "@/components/ui/input";
import Link from "next/link";
import React from "react";
import { Search } from "lucide-react";
import { UserRoundPen } from "lucide-react";
export default function Header() {
  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div>
          <Link href="/">
            <h1 className="text-3xl font-bold">e_shop</h1>
          </Link>
        </div>
        <div className="w-[50%] flex items-center">
          <Input
            type="text"
            placeholder="Search product..."
            className="w-full px-4 py-2 font-poppins font-medium border border-blue-500 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="w-[50px] h-9 rounded-r cursor-pointer flex items-center justify-center bg-blue-500 text-white">
            <Search />
          </div>
        </div>
        <div>
          <Link href="/login">
            <UserRoundPen />
          </Link>
        </div>
      </div>
    </div>
  );
}
