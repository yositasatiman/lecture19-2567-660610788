import { DB, readDB, writeDB } from "@lib/DB";
import { checkToken } from "@lib/checkToken";
import { Database, Payload } from "@lib/types";
import { NextRequest, NextResponse } from "next/server";
import sleep from "sleep-promise";

//GET http://localhost:3000/api/enrollments
export const GET = async () => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }

  // Type casting to "Payload"
  const { role, studentId } = <Payload>payload;

  readDB();
  if (role === "ADMIN") {
    return NextResponse.json({
      ok: true,
      // Type casting to "Database"
      enrollments: (<Database>DB).enrollments,
    });
  }

  const courseNoList = [];
  for (const enroll of (<Database>DB).enrollments) {
    if (enroll.studentId === studentId) {
      courseNoList.push(enroll.courseNo);
    }
  }

  const courses = [];
  for (const courseNo of courseNoList) {
    const course = (<Database>DB).courses.find((x) => x.courseNo === courseNo);
    courses.push(course);
  }

  // simulate delay to get response 
  await sleep(1000);

  return NextResponse.json({
    ok: true,
    courses,
  });
};

//POST http://localhost:3000/api/enrollments
export const POST = async (request:NextRequest) => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }
  const { role, studentId } = <Payload>payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  //read body request
  const body = await request.json();
  const { courseNo } = body;
  if (typeof courseNo !== "string" || courseNo.length !== 6) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo must contain 6 characters",
      },
      { status: 400 }
    );
  }

  readDB();
  const foundCourse = (<Database>DB).courses.find((x) => x.courseNo === courseNo);
  if (!foundCourse) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo does not exist",
      },
      { status: 400 }
    );
  }

  const foundEnroll = (<Database>DB).enrollments.find(
    (x) => x.studentId === studentId && x.courseNo === courseNo
  );
  if (foundEnroll) {
    return NextResponse.json(
      {
        ok: false,
        message: "You already enrolled that course",
      },
      { status: 400 }
    );
  }

  (<Database>DB).enrollments.push({
    studentId,
    courseNo,
  });
  writeDB();

  return NextResponse.json({
    ok: true,
    message: "You has enrolled a course successfully",
  });
};

export const DELETE = async (request:NextRequest) => {
  const payload = checkToken();
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }
  const { role, studentId } = <Payload>payload;

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: true,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  //read body request
  const body = await request.json();
  const { courseNo } = body;
  if (typeof courseNo !== "string" || courseNo.length !== 6) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo must contain 6 characters",
      },
      { status: 400 }
    );
  }

  readDB();
  const foundIndex = (<Database>DB).enrollments.findIndex(
    (x) => x.studentId === studentId && x.courseNo === courseNo
  );
  if (foundIndex === -1) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "You cannot drop from this course. You have not enrolled it yet!",
      },
      { status: 404 }
    );
  }

  (<Database>DB).enrollments.splice(foundIndex, 1);
  writeDB();

  return NextResponse.json({
    ok: true,
    message: "You has dropped from this course. See you next semester.",
  });
};
