"use client";

import { type SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription, FieldGroup, FieldError } from "@/components/ui/field";
import Link from "next/link";
import { api } from "@/lib/api";

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        try {
            await api.post(`/signup`, { email, password })
            router.push("/signin");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error ?? "Something went wrong");
            }
        }
    }

    return (
        <main className="flex min-h-svh items-center justify-center p-6 md:p-10">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>
                        Create an account
                    </CardTitle>
                    <CardDescription>
                        Enter your information below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <FieldDescription>Must be at least 6 characters long.</FieldDescription>
                            </Field>
                            <Field>
                                <Button type="submit">Create Account</Button>
                                <FieldDescription className="text-center">
                                    Already have an account? <Link href="/signin">Sign in</Link>
                                </FieldDescription>
                                <FieldError>{error}</FieldError>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}