import { Module } from '@nestjs/common';
import { SHIPPING_METHODS } from '../shared/tokens/port.token';
import ExpressCourierShippingAdapter from './express-courier/express-courier.shipping.adapter';
import IranPostShippingAdapter from './iran-post/iran-post.shipping.adapter';

@Module({
  providers: [
    ExpressCourierShippingAdapter,
    IranPostShippingAdapter,
    {
      provide: SHIPPING_METHODS,
      inject: [ExpressCourierShippingAdapter, IranPostShippingAdapter],
      useFactory: (
        express: ExpressCourierShippingAdapter,
        post: IranPostShippingAdapter,
      ) => [express, post],
    },
  ],
  exports: [SHIPPING_METHODS],
})
export default class ShippingInfrastructureModule {}
