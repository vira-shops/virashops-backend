import ForbiddenError from '../errors/forbidden.error';
import Role from './enums/role.enum';
import User from './user.model';

describe('User', () => {
  it('does not assign ADMIN from public seller attach', () => {
    const admin = User.createAdmin('09123456789', 'Admin');
    expect(() => admin.addSellerRole(Role.RETAIL_SELLER)).toThrow(
      ForbiddenError,
    );
  });

  it('allows a second seller role for BOTH', () => {
    const user = User.createForSeller(
      '09123456789',
      'Ali',
      'Rezaei',
      Role.RETAIL_SELLER,
    );
    user.addSellerRole(Role.WHOLESALE_SELLER);
    expect(user.getRoles()).toEqual([
      Role.RETAIL_BUYER,
      Role.RETAIL_SELLER,
      Role.WHOLESALE_SELLER,
    ]);
  });

  it('joins first and last name', () => {
    const user = User.createBuyer('09123456789', 'Ali', 'Rezaei');
    expect(user.getFullName()).toBe('Ali Rezaei');
  });
});
