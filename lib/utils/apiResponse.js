import { NextResponse } from "next/server";

export function ok(data = {}, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function created(data = {}) {
  return ok(data, 201);
}

export function error(message = "Something went wrong", status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return error(message, 401);
}

export function forbidden(message = "Forbidden") {
  return error(message, 403);
}

export function notFound(message = "Not found") {
  return error(message, 404);
}

export function serverError(message = "Internal server error") {
  return error(message, 500);
}
