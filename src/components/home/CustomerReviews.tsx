import { useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Star } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  text_bn: string | null;
  text_en: string | null;
  screenshot_url: string | null;
}

const placeholderReviews: Review[] = [
  { id: 'p1', customer_name: 'রহিম আহমেদ', rating: 5, text_bn: 'চমৎকার পণ্য এবং দ্রুত ডেলিভারি। খুবই সন্তুষ্ট।', text_en: 'Excellent products and fast delivery. Very satisfied.', screenshot_url: null },
  { id: 'p2', customer_name: 'করিম হোসেন', rating: 5, text_bn: 'পাইকারি দামে ভালো মানের পণ্য পেলাম।', text_en: 'Got good quality products at wholesale price.', screenshot_url: null },
  { id: 'p3', customer_name: 'সালমা বেগম', rating: 4, text_bn: 'দোকানের জন্য নিয়মিত অর্ডার করি। সবসময় ভালো সার্ভিস পাই।', text_en: 'I order regularly for my shop. Always get great service.', screenshot_url: null },
];

const CustomerReviews = () => {
  const { language, t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>(placeholderReviews);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const autoplayRef = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [autoplayRef.current]);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('id, customer_name, rating, text_bn, text_en, screenshot_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setReviews(data as Review[]);
      });
  }, []);

  return (
    <section className="py-6 sm:py-10 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-center">{t('customer_reviews')}</h2>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-2"
              >
                <div className="bg-card rounded-lg p-4 sm:p-5 border border-border h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (review.rating || 0) ? 'fill-cta text-cta' : 'text-border'}`}
                      />
                    ))}
                  </div>
                  {review.screenshot_url && (
                    <button
                      type="button"
                      onClick={() => setZoomImage(review.screenshot_url)}
                      className="mb-3 self-start"
                    >
                      <img
                        src={review.screenshot_url}
                        alt={`Review by ${review.customer_name}`}
                        className="h-20 w-auto rounded-md object-cover border border-border hover:opacity-90 transition-opacity"
                      />
                    </button>
                  )}
                  {(review.text_bn || review.text_en) && (
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">
                      "{language === 'bn' ? review.text_bn || review.text_en : review.text_en || review.text_bn}"
                    </p>
                  )}
                  <p className="text-sm font-semibold mt-auto">{review.customer_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!zoomImage} onOpenChange={(o) => !o && setZoomImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          {zoomImage && <img src={zoomImage} alt="Review screenshot" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CustomerReviews;
