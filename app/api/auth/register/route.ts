import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { Workspace } from "@/lib/models/Workspace";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, username, phone, password, initialWorkspaceTitle } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "يرجى تعبئة كافة الحقول المطلوبة (الاسم، اسم المستخدم، كلمة المرور)" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json(
        { error: "اسم المستخدم هذا مسجل بالفعل، يرجى اختيار اسم آخر" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      phone: phone?.trim() || "",
      passwordHash,
    });

    // Create an initial default Madyafa workspace for the new user
    const title = initialWorkspaceTitle?.trim() || `مضيافة ${name.trim()}`;
    const slug = `${cleanUsername}-madyafa-${Date.now().toString(36)}`;
    const workspace = await Workspace.create({
      title,
      description: "المضيافة الرئيسية لمتابعة التحصيل وصندوق الخير",
      ownerId: user._id,
      moderators: [],
      settings: {
        defaultAmount: 100,
        defaultColPrefix: "دفعة",
        currency: "ج.م",
        publicSlug: slug,
        publicPin: "",
      },
    });

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
      },
      initialWorkspaceId: workspace._id.toString(),
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحساب: " + (error.message || "") },
      { status: 500 }
    );
  }
}
