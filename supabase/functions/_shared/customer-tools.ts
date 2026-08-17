import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Supabase environment variables are not configured"
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
);

export async function searchProducts(query: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`
      id,
      name_en,
      name_bn,
      description_en,
      description_bn,
      price,
      stock,
      reserved_stock,
      stock_status,
      images,
      slug
    `)
    .eq("is_active", true)
    .or(`name_en.ilike.%${query}%,name_bn.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(`Product search failed: ${error.message}`);
  }

  return data ?? [];
}

export async function calculateBulkQuote(
  productId: string,
  quantity: number,
) {
  // 1. Get the product
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select(`
      id,
      price,
      stock,
      reserved_stock
    `)
    .eq("id", productId)
    .eq("is_active", true)
    .single();

  if (productError) {
    throw new Error(`Product lookup failed: ${productError.message}`);
  }

  if (!product) {
    throw new Error("Product not found");
  }

  // 2. Calculate available stock
  const availableStock =
    (product.stock ?? 0) - (product.reserved_stock ?? 0);

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (quantity > availableStock) {
    throw new Error(
      `Only ${availableStock} units are currently available`,
    );
  }

  // 3. Get bulk pricing rules
  const { data: rules, error: rulesError } = await supabaseAdmin
    .from("bulk_pricing_rules")
    .select(`
      minimum_quantity,
      discount_percent
    `)
    .eq("product_id", productId)
    .lte("minimum_quantity", quantity)
    .order("minimum_quantity", { ascending: false });

  if (rulesError) {
    throw new Error(`Bulk pricing lookup failed: ${rulesError.message}`);
  }

  // 4. Use the highest applicable quantity tier
  const discountPercent = rules?.[0]?.discount_percent ?? 0;

  // 5. Calculate candidate price
  const candidatePrice =
    product.price * (1 - discountPercent / 100);

  // 6. Get business rules
  const { data: businessRule, error: businessError } =
    await supabaseAdmin
      .from("product_business_rules")
      .select(`
        cost_price,
        minimum_margin_percent,
        maximum_discount_percent
      `)
      .eq("product_id", productId)
      .single();

  if (businessError) {
    throw new Error(
      `Business rule lookup failed: ${businessError.message}`,
    );
  }

  if (!businessRule) {
    throw new Error("Business rules not found for this product");
  }

  // 7. Enforce maximum allowed discount
  const safeDiscountPercent = Math.min(
    discountPercent,
    businessRule.maximum_discount_percent,
  );

  const safeCandidatePrice =
    product.price * (1 - safeDiscountPercent / 100);

  // 8. Calculate minimum profitable price
  const minimumProfitablePrice =
    businessRule.cost_price *
    (1 + businessRule.minimum_margin_percent / 100);

  // 9. Final price can never go below the minimum profitable price
  const finalPrice = Math.max(
    safeCandidatePrice,
    minimumProfitablePrice,
  );

  return {
    product_id: product.id,
    quantity,
    selling_price: product.price,
    discount_percent: safeDiscountPercent,
    candidate_price: safeCandidatePrice,
    minimum_profitable_price: minimumProfitablePrice,
    final_price: finalPrice,
    available_stock: availableStock,
  };
}