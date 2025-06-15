import * as bcrypt from 'bcrypt';

export const encodePassword = async (rawPassword: string) => {
  const SALT = bcrypt.genSaltSync();

  return await bcrypt.hash(rawPassword, SALT);
};

export const comparePassword = (
  rawPassword: string,
  hashedPassword: string,
) => {
  return bcrypt.compareSync(rawPassword, hashedPassword);
};
