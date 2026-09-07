/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CachedImage } from './CachedImage';
import { preloadImage } from '../utils/imageCache';
import { MasterSweet, WeightVariant } from '../types';
import { supabase } from '../db/supabaseClient';
import {
  X,
  Plus,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Percent,
  Clock,
  PackageCheck,
  CheckCircle2,
  Upload,
  Trash2,
  Edit3,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';

interface AddSweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sweetToEdit?: MasterSweet | null;
}

const PRESET_IMAGES = [
  { label: 'काजू कतली', url: 'https://th.bing.com/th/id/OIP.p95T_AH9o_AbCgDM1Ie4ZAHaE8?w=275&h=184&c=7&r=0&o=7&pid=1.7&rm=3' },
  { label: 'मूंग दाल बर्फी', url: 'https://anandams.com/wp-content/uploads/2024/01/Moong-Dal-Burfi-scaled.jpg' },
  { label: 'मठरी (खस्ता मठरी)', url: 'https://resize.indiatv.in/resize/newbucket/1200_675/2026/02/mt-1771412570.webp' },
  { label: 'मोतीचूर लाडू', url: '/images/motichoor_ladoo_dmb_1785830283483.jpg' },
  { label: 'केसर घेवर', url: '/images/kesar_ghevar_1785741274079.jpg' },
  { label: 'मिल्क केक', url: '/images/milk_cake_dmb_1785830317278.jpg' },
  { label: 'ड्राय फ्रूट गिफ़्त बॉक्स', url: '/images/mix_dry_fruits_1785741241492.jpg' },
  { label: 'गुलाब जामुन', url: '/images/gulab_jamun_1785741287674.jpg' },
  { label: 'रसगुल्ला', url: '/images/rasgulla_dmb_1785830458412.jpg' }
];

export const AddSweetModal: React.FC<AddSweetModalProps> = ({ isOpen, onClose, sweetToEdit }) => {
  const { addMasterSweet, updateMasterSweet, language } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameHi, setNameHi] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<'dry' | 'bengali' | 'traditional' | 'gift' | 'mawa'>('traditional');
  const [basePrice, setBasePrice] = useState<number>(650);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [descriptionHi, setDescriptionHi] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [ingredientsHi, setIngredientsHi] = useState('शुद्ध देशी घी, ड्राई फ्रूट्स, इलायची, केसर');
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(30);
  const [hsnCode, setHsnCode] = useState('2106');
  const [gstPercent, setGstPercent] = useState<number>(5);

  // Images state (max 3)
  const [images, setImages] = useState<string[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Variants selection
  const [selectedVariants, setSelectedVariants] = useState<WeightVariant[]>([
    { label: '250g', weightInKg: 0.25 },
    { label: '500g', weightInKg: 0.5 },
    { label: '1kg', weightInKg: 1.0 },
    { label: '2kg Box', weightInKg: 2.0 }
  ]);

  useEffect(() => {
    if (sweetToEdit) {
      setNameHi(sweetToEdit.nameHi || '');
      setNameEn(sweetToEdit.nameEn || '');
      setCategory(sweetToEdit.category || 'traditional');
      setBasePrice(sweetToEdit.basePrice || 600);
      setDiscountPercent(sweetToEdit.discountPercent || 0);
      setDescriptionHi(sweetToEdit.descriptionHi || '');
      setDescriptionEn(sweetToEdit.descriptionEn || '');
      setIngredientsHi(sweetToEdit.ingredientsHi || 'शुद्ध देशी घी, ड्राई फ्रूट्स, इलायची, केसर');
      setShelfLifeDays(sweetToEdit.shelfLifeDays || 30);
      setHsnCode(sweetToEdit.hsnCode || '2106');
      setGstPercent(sweetToEdit.gstPercent || 5);

      const existingImgs =
        sweetToEdit.images && sweetToEdit.images.length > 0
          ? sweetToEdit.images
          : [sweetToEdit.imageUrl];
      setImages(existingImgs.slice(0, 3));

      if (sweetToEdit.variants && sweetToEdit.variants.length > 0) {
        setSelectedVariants(sweetToEdit.variants);
      }
    } else {
      setNameHi('');
      setNameEn('');
      setCategory('traditional');
      setBasePrice(650);
      setDiscountPercent(10);
      setDescriptionHi('');
      setDescriptionEn('');
      setIngredientsHi('शुद्ध देशी घी, ड्राई फ्रूट्स, इलायची, केसर');
      setShelfLifeDays(30);
      setHsnCode('2106');
      setGstPercent(5);
      setImages([PRESET_IMAGES[0].url]);
      setSelectedVariants([
        { label: '250g', weightInKg: 0.25 },
        { label: '500g', weightInKg: 0.5 },
        { label: '1kg', weightInKg: 1.0 },
        { label: '2kg Box', weightInKg: 2.0 }
      ]);
    }
  }, [sweetToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleVariant = (variant: WeightVariant) => {
    const exists = selectedVariants.some((v) => v.label === variant.label);
    if (exists) {
      if (selectedVariants.length === 1) return; // keep at least 1
      setSelectedVariants(selectedVariants.filter((v) => v.label !== variant.label));
    } else {
      setSelectedVariants([...selectedVariants, variant]);
    }
  };

  // Image Upload Handlers (Max 3)
  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (images.length >= 3) {
      alert(language === 'hi' ? 'अधिकतम 3 चित्र जोड़े जा सकते हैं।' : 'Maximum 3 images allowed.');
      return;
    }

    const availableSlots = 3 - images.length;
    const filesToUpload = files.slice(0, availableSlots);

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        alert(language === 'hi' ? 'केवल फ़ोटो/इमेज फ़ाइलें अपलोड करें।' : 'Please upload image files only.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(language === 'hi' ? 'फ़ाइल 5MB से छोटी होनी चाहिए।' : 'Image size must be less than 5MB.');
        continue;
      }

      let uploadedUrl = '';
      if (supabase) {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `sweet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('sweets').upload(fileName, file, {
            contentType: file.type,
            upsert: true
          });

          if (!uploadErr) {
            uploadedUrl = supabase.storage.from('sweets').getPublicUrl(fileName).data.publicUrl;
          }
        } catch (err) {
          console.error('Supabase upload failed, falling back to FileReader:', err);
        }
      }

      if (uploadedUrl) {
        preloadImage(uploadedUrl);
        setImages((prev) => (prev.length < 3 ? [...prev, uploadedUrl] : prev));
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const dataUrl = e.target.result as string;
            setImages((prev) => (prev.length < 3 ? [...prev, dataUrl] : prev));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    if (images.length >= 3) {
      alert(language === 'hi' ? 'अधिकतम 3 चित्र जोड़े जा सकते हैं।' : 'Maximum 3 images allowed.');
      return;
    }
    const url = customUrlInput.trim();
    preloadImage(url);
    setImages([...images, url]);
    setCustomUrlInput('');
  };

  const handleAddPreset = (url: string) => {
    if (images.length >= 3) {
      alert(language === 'hi' ? 'अधिकतम 3 चित्र जोड़े जा सकते हैं।' : 'Maximum 3 images allowed.');
      return;
    }
    preloadImage(url);
    setImages([...images, url]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameHi.trim()) {
      alert(language === 'hi' ? 'कृपया मिठाई का नाम दर्ज करें' : 'Please enter sweet name');
      return;
    }

    if (images.length === 0) {
      alert(language === 'hi' ? 'कम से कम एक चित्र (इमेज) जोड़ना आवश्यक है।' : 'Please upload or select at least 1 image.');
      return;
    }

    const primaryImg = images[0] || PRESET_IMAGES[0].url;

    if (sweetToEdit) {
      const updatedSweet: MasterSweet = {
        ...sweetToEdit,
        nameHi: nameHi.trim(),
        nameEn: nameEn.trim() || nameHi.trim(),
        category,
        hsnCode,
        gstPercent,
        descriptionHi: descriptionHi.trim() || 'शुद्ध देशी घी एवं गुणवत्तापूर्ण सामग्री से निर्मित उत्कृष्ट मिठाई।',
        descriptionEn: descriptionEn.trim() || 'Delicious sweet made with pure ingredients.',
        imageUrl: primaryImg,
        images: images,
        basePrice,
        discountPercent,
        shelfLifeDays,
        ingredientsHi,
        variants: selectedVariants
      };

      updateMasterSweet(updatedSweet);

      alert(
        language === 'hi'
          ? `मिठाई '${nameHi}' को सफलतापूर्वक अद्यतन (Edit) किया गया!`
          : `Sweet '${nameHi}' updated successfully!`
      );
    } else {
      const newSweet: MasterSweet = {
        id: `sweet_${Date.now()}`,
        nameHi: nameHi.trim(),
        nameEn: nameEn.trim() || nameHi.trim(),
        category,
        hsnCode,
        gstPercent,
        descriptionHi: descriptionHi.trim() || 'शुद्ध देशी घी एवं गुणवत्तापूर्ण सामग्री से निर्मित उत्कृष्ट मिठाई।',
        descriptionEn: descriptionEn.trim() || 'Delicious sweet made with pure ingredients.',
        imageUrl: primaryImg,
        images: images,
        basePrice,
        discountPercent,
        shelfLifeDays,
        ingredientsHi,
        variants: selectedVariants,
        isPureVeg: true
      };

      addMasterSweet(newSweet);

      alert(
        language === 'hi'
          ? `नया व्यंजन '${nameHi}' मास्टर कैटलॉग एवं सभी शहरों में सफलतापूर्वक जोड़ा गया!`
          : `Sweet '${nameHi}' successfully added to master catalog!`
      );
    }

    onClose();
  };

  const isEditMode = Boolean(sweetToEdit);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border-2 border-amber-400 animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-900 via-amber-900 to-orange-950 text-white p-4 flex items-center justify-between border-b border-amber-500/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm">
              {isEditMode ? <Edit3 className="w-5 h-5 text-orange-950" /> : <Sparkles className="w-5 h-5 text-orange-950" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-200 leading-tight">
                {isEditMode
                  ? (language === 'hi' ? `मिठाई संपादित करें (${sweetToEdit?.nameHi})` : `Edit Sweet: ${sweetToEdit?.nameEn}`)
                  : (language === 'hi' ? 'नई मिठाई जोड़ें (Admin Catalog Entry)' : 'Add New Sweet Item')}
              </h3>
              <p className="text-[11px] text-amber-100/80">
                {language === 'hi'
                  ? 'मास्टर विवरण, मूल्य, डिस्काउंट प्रतिशत एवं 3 चित्रों तक गैलरी अपडेट करें'
                  : 'Update sweet details, pricing, discount, and gallery (max 3 images)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-sans">
          
          {/* Section 1: Sweet Name & Category */}
          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-amber-950 tracking-wider flex items-center gap-1.5 font-mono">
              <Tag className="w-4 h-4 text-orange-600" />
              <span>{language === 'hi' ? '1. नाम व श्रेणी (Name & Category)' : '1. Name & Category'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  मिठाई का नाम (हिन्दी) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. शुद्ध देशी घी केसर लाडू"
                  value={nameHi}
                  onChange={(e) => setNameHi(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Sweet Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Desi Ghee Kesar Ladoo"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                मिठाई श्रेणी (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="traditional">पारंपरिक / शुद्ध घी मिठाई (Traditional Pure Ghee)</option>
                <option value="dry">काजू व ड्राई फ्रूट मिठाई (Dry Fruit)</option>
                <option value="bengali">बंगाली रसगुल्ला / छैना (Bengali)</option>
                <option value="gift">उत्सव गिफ़्त पैक (Festival Gift Box)</option>
                <option value="mawa">मावा / खोया विशेष (Mawa Special)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Pricing, Discount & GST */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5 font-mono">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span>{language === 'hi' ? '2. मूल मूल्य व छूट (Pricing & Discount)' : '2. Price & Discount'}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  मूल मूल्य (₹ / kg) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  step="10"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-extrabold text-blue-950 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  प्री-बुकिंग छूट (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-extrabold text-emerald-700 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  HSN कोड
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  GST दर (%)
                </label>
                <input
                  type="number"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Descriptions & Ingredients */}
          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-amber-950 tracking-wider flex items-center gap-1.5 font-mono">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>{language === 'hi' ? '3. विवरण व शेल्फ लाइफ (Description & Shelf Life)' : '3. Description & Shelf Life'}</span>
            </h4>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                विवरण (हिन्दी)
              </label>
              <textarea
                rows={2}
                placeholder="शुद्ध देशी घी, बादाम व केसर की मनमोहक खुशबू से परिपूर्ण..."
                value={descriptionHi}
                onChange={(e) => setDescriptionHi(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  मुख्य सामग्री (Ingredients)
                </label>
                <input
                  type="text"
                  placeholder="बेसन, देशी घी, केसर, काजू"
                  value={ingredientsHi}
                  onChange={(e) => setIngredientsHi(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  शेल्फ लाइफ (दिनों में)
                </label>
                <input
                  type="number"
                  value={shelfLifeDays}
                  onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Image Upload (3 Images Max) */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase text-blue-950 tracking-wider flex items-center gap-1.5 font-mono">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>{language === 'hi' ? '4. चित्र अपलोड करें (Upload Max 3 Images)' : '4. Image Gallery (Max 3 Images)'}</span>
              </h4>
              <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                images.length === 3 ? 'bg-amber-200 text-amber-900 border border-amber-300' : 'bg-blue-200 text-blue-900'
              }`}>
                {images.length}/3 {language === 'hi' ? 'चित्र चुने गए' : 'Images Selected'}
              </span>
            </div>

            {/* Current Images Thumbnails */}
            <div className="grid grid-cols-3 gap-2.5">
              {[0, 1, 2].map((slotIndex) => {
                const imgUrl = images[slotIndex];
                return (
                  <div
                    key={slotIndex}
                    className={`relative rounded-xl border-2 flex flex-col items-center justify-center min-h-[96px] overflow-hidden bg-white transition-all ${
                      imgUrl ? 'border-slate-300 shadow-xs' : 'border-dashed border-blue-300/80 bg-white/70'
                    }`}
                  >
                    {imgUrl ? (
                      <>
                        <CachedImage
                          src={imgUrl}
                          alt={`Sweet image ${slotIndex + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        {slotIndex === 0 && (
                          <span className="absolute top-1 left-1 bg-orange-600 text-white font-extrabold font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                            {language === 'hi' ? 'मुख्य फ़ोटो' : 'Primary'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(slotIndex)}
                          title="चित्र हटाएं"
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow transition-all active:scale-90 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="p-2 text-center text-slate-400 space-y-1">
                        <ImageIcon className="w-5 h-5 mx-auto text-blue-300" />
                        <span className="text-[10px] block font-mono">
                          {slotIndex === 0 ? 'चित्र 1 (Primary)' : `चित्र ${slotIndex + 1}`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drag & Drop Upload Zone */}
            {images.length < 3 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-orange-500 bg-orange-50/80 scale-[1.01]'
                    : 'border-blue-400/80 bg-white hover:bg-blue-50/50 hover:border-blue-500'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 text-blue-900">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-blue-950 block">
                      {language === 'hi'
                        ? 'फ़ाइल चुनने के लिए क्लिक करें या यहाँ ड्रैग करें (Max 3 Images)'
                        : 'Click to upload files or drag & drop images here'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      JPG, PNG, WEBP (अधिकतम 5MB प्रति फ़ाइल)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 flex items-center gap-2 text-[11px] font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'अधिकतम 3 चित्रों की सीमा पूरी हो चुकी है। नया अपलोड करने के लिए किसी पुराने चित्र को हटाएं।'
                    : 'Maximum limit of 3 images reached. Remove an existing image to upload another.'}
                </span>
              </div>
            )}

            {/* Alternative: Add Image URL & Presets */}
            {images.length < 3 && (
              <div className="pt-1 space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="url"
                      placeholder="अथवा इमेज URL यहाँ चिपकाएँ (or paste image URL)..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px] text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomUrl}
                    disabled={!customUrlInput.trim()}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0"
                  >
                    + URL जोड़ें
                  </button>
                </div>

                <div>
                  <span className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                    त्वरित लाइब्रेरी चित्र (Quick Presets):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleAddPreset(preset.url)}
                        disabled={images.length >= 3}
                        className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 disabled:opacity-40 text-amber-950 font-bold rounded text-[10.5px] transition-colors cursor-pointer active:scale-95 shadow-2xs"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Weight Variants Selection */}
          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-2">
            <h4 className="font-bold text-xs uppercase text-amber-950 tracking-wider flex items-center gap-1.5 font-mono">
              <PackageCheck className="w-4 h-4 text-orange-600" />
              <span>{language === 'hi' ? '5. उपलब्ध वज़न पैकिंग (Weight Options)' : '5. Pack Sizes'}</span>
            </h4>

            <div className="flex flex-wrap gap-2">
              {[
                { label: '250g', weightInKg: 0.25 },
                { label: '500g', weightInKg: 0.5 },
                { label: '1kg', weightInKg: 1.0 },
                { label: '2kg Box', weightInKg: 2.0 },
                { label: '5kg Family', weightInKg: 5.0 }
              ].map((v) => {
                const isSelected = selectedVariants.some((sv) => sv.label === v.label);
                return (
                  <button
                    type="button"
                    key={v.label}
                    onClick={() => toggleVariant(v)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-700 text-white border-orange-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-300'}`} />
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              <span>
                {isEditMode
                  ? (language === 'hi' ? 'बदलाव सुरक्षित करें (Save Changes)' : 'Save Changes')
                  : (language === 'hi' ? 'कैटलॉग में मिठाई सुरक्षित करें' : 'Save Sweet to Catalog')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
