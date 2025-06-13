import * as bcrypt from 'bcrypt';

export const encodePassword = (rawPassword: string) => {
  const SALT = bcrypt.genSaltSync();

  return bcrypt.hash(rawPassword, SALT);
};

export const comparePassword = (
  rawPassword: string,
  hashedPassword: string,
) => {
  return bcrypt.compareSync(rawPassword, hashedPassword);
};
