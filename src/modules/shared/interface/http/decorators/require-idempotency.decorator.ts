import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_META_KEY = 'idempotency';

const RequireIdempotency = () => SetMetadata(IDEMPOTENCY_META_KEY, true);

export default RequireIdempotency;
