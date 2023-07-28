import { Request } from "express";

export interface IJWTUser {
  readonly uid: string;
  readonly fiscal_number: string;
  readonly name: string;
  readonly family_name: string;
  readonly email: string;
  readonly spid_level: string;
}

const emptyJWT: IJWTUser = {
  email: "",
  family_name: "",
  fiscal_number: "",
  name: "",
  spid_level: "",
  uid: ""
};

export const parseJwt = (token: string): IJWTUser => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return emptyJWT;
  }
};

export const checkBearerToken = (req: Request): IJWTUser => {
  const authHeader: string = req.headers.authorization || "";
  try {
    return parseJwt(authHeader.slice(7));
  } catch (e) {
    return emptyJWT;
  }
};
