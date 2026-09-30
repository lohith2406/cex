"use client";

import { useContext, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription, FieldGroup, FieldError } from "@/components/ui/field";
import Link from "next/link";
import axios from "axios";
import { api } from "@/lib/api";
import { useSignIn } from "@/queries/useUser";

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const signIn = useSignIn();

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        try {
            const response = await api.post<{ data: { token: string } }>(`/signin`, { email, password });
            signIn(response.data.data.token);
            router.replace("/");
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
                        Login to your account
                    </CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
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
                            </Field>

                            <Field>
                                <Button type="submit">Login</Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                                </FieldDescription>
                                <FieldError>{error}</FieldError>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}