import { Column, Entity, Index } from 'typeorm';
import CoreEntity from '../../../../../common/database/core.entity';
import SalesType from '../../../domain/model/enums/sales-type.enum';
import SellerDocumentType from '../../../domain/model/enums/seller-document-type.enum';
import SellerKind from '../../../domain/model/enums/seller-kind.enum';
import SellerStatus from '../../../domain/model/enums/seller-status.enum';

@Entity('sellers')
export default class SellerEntity extends CoreEntity {
  @Index({ unique: true })
  @Column()
  user_id: number;

  @Column({ type: 'varchar', length: 20 })
  kind: SellerKind;

  @Column({ name: 'shop_name', type: 'varchar', length: 160 })
  shop_name: string;

  @Column({ name: 'workplace_phone', type: 'varchar', length: 20, nullable: true })
  workplace_phone: string | null;

  @Column({ type: 'varchar', length: 80 })
  province: string;

  @Column({ type: 'varchar', length: 80 })
  city: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 10, nullable: true })
  postal_code: string | null;

  @Column({ name: 'sales_type', type: 'varchar', length: 20 })
  sales_type: SalesType;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'document_type', type: 'varchar', length: 32 })
  document_type: SellerDocumentType;

  @Column({ name: 'document_key', type: 'varchar', length: 255 })
  document_key: string;

  @Column({ type: 'varchar', length: 20, default: SellerStatus.PENDING })
  status: SellerStatus;
}
