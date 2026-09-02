import ForbiddenError from '../errors/forbidden.error';
import SellerAlreadyExistsError from '../errors/seller-already-exists.error';
import Role from './enums/role.enum';
import User from './user.model';

describe('User', () => {
  it('does not assign ADMIN from public seller attach', () => {
    const admin = User.createAdmin('09123456789', 'Admin');
    expect(() => admin.addSellerRole(Role.RETAIL_SELLER)).toThrow(
      ForbiddenError,
    );
  });

  it('rejects a second seller role', () => {
    const user = User.createForSeller(
      '09123456789',
      'Ali',
      Role.RETAIL_SELLER,
    );
    expect(() => user.addSellerRole(Role.WHOLESALE_SELLER)).toThrow(
      SellerAlreadyExistsError,
    );
  });
});
