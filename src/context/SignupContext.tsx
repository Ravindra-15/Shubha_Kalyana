import React, { createContext, useContext, useState, ReactNode } from 'react';

type SignupData = {
  profileFor?: string;
  gender?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  religion?: string;
  caste?: string;
  subCaste?: string;
  livingIn?: string;
  mobile?: string;
  email?: string;
  motherTongue?: string;
  lookingFor?: string;
};

type SignupContextType = {
  data: SignupData;
  setField: (key: keyof SignupData, value: string) => void;
  reset: () => void;
};

const SignupContext = createContext<SignupContextType>({} as SignupContextType);

export const SignupProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<SignupData>({});
  const setField = (key: keyof SignupData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));
  const reset = () => setData({});
  return (
    <SignupContext.Provider value={{ data, setField, reset }}>
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = () => useContext(SignupContext);