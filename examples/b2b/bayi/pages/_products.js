/** Bayi katalog ürünlerini kart şablonuna uyarlar (kategoriye göre örnek görsel). */
const IMG = {
  Sensör: 'sicaklik-nem-sensoru-ts100', 'Ağ geçidi': 'lorawan-ag-gecidi-gw400', 'Röle & kontrol': 'akilli-role-modulu-rl2',
  Enerji: 'trifaze-enerji-analizoru-em3', Aksesuar: 'din-ray-guc-kaynagi-ps24', Yazılım: 'helios-cloud-yillik-lisans',
};
export const toCard = (p) => ({
  id: p.id, name: p.name, brand: `${p.brand} · ${p.sku}`, cat: p.cat, stock: p.stock,
  price: p.dealerPrice, oldPrice: p.listPrice,
  image: IMG[p.cat] ? `examples/img/products/${IMG[p.cat]}.svg` : 'assets/img/placeholder.svg',
  url: '#/katalog', tags: p.critical && p.stock > 0 ? ['Son ürünler'] : [],
});
