import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials" 
import Google from "next-auth/providers/google"
import User from "./models/User";
import bcryptjs from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
        credentials: {
          email: {label: "Email", type: "email", },
          password: {label: "Password", type: "password"},
        },
        authorize: async (credentials) => {
            const {email, password} = credentials;
            if(!email || !password){
                throw new CredentialsSignin("Please enter both email and password")
            }
            const user = User.findOne({email});
            if(!user) throw new CredentialsSignin("no user with this email exists");
            const correctPassword = bcryptjs.compare(password, user.password);
            if(!correctPassword){
                throw new Error("Incorrect password");
            }
            else return user;
        },
        pages: {
            signIn: "/login",
        },
        callbacks: {
            signIn: async ({ user, account}) => {
                if(account?.provider === "google"){
                    try {
                        const {email, name, image, id} = user;
                        await connectDb();
                        const alreadyUser = User.findOne({email});
                        if(!alreadyUser){
                            const newUser = User.Model({
                                email,
                                name,
                                image,
                                googleId: id
                            })
                            await newUser.save(); 
                        }
                    } catch (error) {
                        
                    }
                }
            }
        }
    }),
    
  ],
})