import React, { useState } from "react";
import { Package, Search, Check, Calendar, Clock, Image as ImageIcon, Globe, Heart, ShoppingCart, User, Star, MapPin, MessageSquare, Eye, Edit, Trash2, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cnTabsTriggerPill } from "@/components/ui/tabTriggerVariants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/StatusBadge";
import ProductCard from "@/components/products/ProductCard";
import BlogCard from "@/components/blog/BlogCard";
import { spText } from "@/utils/typography";
import { spItemCard } from "@/utils/spStandards";
import { useProductCardStyle, type ProductCardStyleId } from "@/context/ProductCardStyleContext";
import { useBlogCardStyle, type BlogCardStyleId } from "@/context/BlogCardStyleContext";
import { useToast } from "@/components/ui/toast";

const DEMO_CARD = {
  id: "demo-style",
  name: "Hand forged tomahawk 'Nanook'",
  price: 170,
  discount: 20,
  image: "/product.png",
};

const DEMO_BLOG = {
  id: "demo-blog",
  title: "A New Chapter for Blacksmiths: Welcome to Our Dedicated Forging Store",
  description:
    "We're excited to announce the launch of our new dedicated blacksmithing store — a space built for makers who value craft, tools, and tradition.",
  image:
    "https://res.cloudinary.com/dzd6t77ep/image/upload/v1784874600/blogs/w750ssxeq39dpyxz2rbz.jpg",
  date: "12 Jan 2026",
  niche: "Forging",
};

// Component categories with examples
const componentCategories = [
  {
    id: "buttons",
    name: "Buttons",
    description: "Outline / Grey / Default / Hover / Onpress",
    components: [
      {
        name: "Outline Button",
        example: (
          <button className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Add
          </button>
        ),
      },
      {
        name: "Grey Fill Button",
        example: (
          <button className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
            Add
          </button>
        ),
      },
      {
        name: "Primary Button",
        example: (
          <button 
            className="px-5 py-2 text-white rounded-lg transition-colors theme-button"
            style={{ backgroundColor: "var(--theme-primary)" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--theme-dark)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--theme-primary)"}
          >
            Add
          </button>
        ),
      },
      {
        name: "Button with Icon",
        example: <Button className="theme-button"><Plus className="w-4 h-4" /> Add Item</Button>,
      },
      {
        name: "Loading Button",
        example: <Button className="theme-button" loading>Loading...</Button>,
      },
    ],
  },
  {
    id: "inputs",
    name: "Inputs",
    description: "Default / Active / with info / valid",
    components: [
      {
        name: "Text Input",
        example: (
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="placeholder" />
          </div>
        ),
      },
      {
        name: "Text Input (Active)",
        example: (
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="placeholder" autoFocus />
          </div>
        ),
      },
      {
        name: "Textarea",
        example: (
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Enter description..." rows={4} />
          </div>
        ),
      },
      {
        name: "Select Dropdown",
        example: (
          <div className="space-y-2">
            <Label>Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Category 1</SelectItem>
                <SelectItem value="2">Category 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ),
      },
    ],
  },
  {
    id: "pickers",
    name: "Pickers",
    description: "Date / Time / Color / Image / Country Code",
    components: [
      {
        name: "Date Picker",
        example: (
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Input type="date" />
          </div>
        ),
      },
      {
        name: "Time Picker",
        example: (
          <div className="space-y-2">
            <Label>Select Time</Label>
            <Input type="time" />
          </div>
        ),
      },
      {
        name: "Color Picker",
        example: (
          <div className="space-y-2">
            <Label>Select Color</Label>
            <Input type="color" className="h-12 w-full" />
          </div>
        ),
      },
      {
        name: "Image Picker",
        example: (
          <div className="space-y-2">
            <Label>Upload Image</Label>
            <Input type="file" accept="image/*" />
          </div>
        ),
      },
    ],
  },
  {
    id: "cards",
    name: "Item Card",
    description: "Product card styles — pick one for the whole website",
    components: [],
  },
  {
    id: "blog-cards",
    name: "Blog Card",
    description: "Blog card styles — pick one for the whole website",
    components: [],
  },
  {
    id: "text",
    name: "Text",
    description: "Headings, Paragraphs, Labels",
    components: [
      {
        name: "Heading 1",
        example: <h1 className={spText.h1}>Heading 1</h1>,
      },
      {
        name: "Heading 2",
        example: <h2 className={spText.h2}>Heading 2</h2>,
      },
      {
        name: "Heading 3",
        example: <h3 className={spText.h3}>Heading 3</h3>,
      },
      {
        name: "Paragraph",
        example: <p className={spText.paragraph}>This is a paragraph text with default styling.</p>,
      },
      {
        name: "Label",
        example: <Label className={spText.label}>Form Label</Label>,
      },
    ],
  },
  {
    id: "icons",
    name: "Icons",
    description: "Lucide React Icons",
    components: [
      {
        name: "Common Icons",
        example: (
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">Heart</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">Cart</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <User className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">User</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">Star</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MapPin className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">Location</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MessageSquare className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">Message</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Eye className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">View</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Edit className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">Edit</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Trash2 className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-500">Delete</span>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "badges",
    name: "Badges",
    description: "Status and Labels",
    components: [
      {
        name: "Status Badges",
        example: (
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="pending" type="order" />
            <StatusBadge status="completed" type="order" />
            <StatusBadge status="cancel" type="order" />
            <StatusBadge status="active" type="product" />
            <StatusBadge status="inactive" type="product" />
            <StatusBadge status="read" type="query" />
            <StatusBadge status="replied" type="query" />
          </div>
        ),
      },
      {
        name: "Custom Badges",
        example: (
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge className="bg-blue-500">Custom</Badge>
          </div>
        ),
      },
    ],
  },
];

function ProductCardStylesPanel() {
  const { productCardStyle, saveProductCardStyle, saving } = useProductCardStyle();
  const { success, error } = useToast();

  const selectStyle = async (style: ProductCardStyleId) => {
    try {
      await saveProductCardStyle(style);
      success(
        style === "2"
          ? "Product Card Style 2 applied site-wide."
          : "Product Card Style 1 applied site-wide."
      );
    } catch {
      error("Failed to save product card style.");
    }
  };

  const styles: { id: ProductCardStyleId; title: string; description: string }[] = [
    {
      id: "1",
      title: "Product Card Style 1",
      description: "Default card — portrait image, left text, theme sale badge",
    },
    {
      id: "2",
      title: "Product Card Style 2",
      description: "1:1 image, centered title & price, red sale badge (top-right)",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select one style. It applies everywhere product cards appear (shop, home grids, blogs, wishlist).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {styles.map((s) => {
          const selected = productCardStyle === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={saving}
              onClick={() => void selectStyle(s.id)}
              className={`text-left rounded-xl border-2 p-4 transition ${
                selected
                  ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_8%,white)]"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                </div>
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected
                      ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]"
                      : "border-gray-300"
                  }`}
                >
                  {selected ? <Check className="w-3 h-3 text-white" /> : null}
                </span>
              </div>
              <div className={`mx-auto ${spItemCard.demoMaxWidth}`}>
                <ProductCard {...DEMO_CARD} skipWishlist forceStyle={s.id} />
              </div>
              <p className="mt-3 text-xs text-center text-gray-500">
                {selected ? (saving ? "Saving…" : "Active on website") : "Click to use this style"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlogCardStylesPanel() {
  const { blogCardStyle, saveBlogCardStyle, saving } = useBlogCardStyle();
  const { success, error } = useToast();

  const selectStyle = async (style: BlogCardStyleId) => {
    try {
      await saveBlogCardStyle(style);
      success(
        style === "2"
          ? "Blog Card Style 2 applied site-wide."
          : "Blog Card Style 1 applied site-wide."
      );
    } catch {
      error("Failed to save blog card style.");
    }
  };

  const styles: { id: BlogCardStyleId; title: string; description: string }[] = [
    {
      id: "1",
      title: "Blog Card Style 1",
      description: "16:9 image card — title, category badge, views & date",
    },
    {
      id: "2",
      title: "Blog Card Style 2",
      description: "9:6 image, title, excerpt, underlined Read more",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select one style. It applies everywhere blog cards appear (home feed, /blogs, catalog sections).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {styles.map((s) => {
          const selected = blogCardStyle === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={saving}
              onClick={() => void selectStyle(s.id)}
              className={`text-left rounded-xl border-2 p-4 transition ${
                selected
                  ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_8%,white)]"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                </div>
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected
                      ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]"
                      : "border-gray-300"
                  }`}
                >
                  {selected ? <Check className="w-3 h-3 text-white" /> : null}
                </span>
              </div>
              <div className="mx-auto max-w-[280px]">
                <BlogCard {...DEMO_BLOG} forceStyle={s.id} />
              </div>
              <p className="mt-3 text-xs text-center text-gray-500">
                {selected ? (saving ? "Saving…" : "Active on website") : "Click to use this style"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// SP Standards Kit
const spStandards = {
  sizes: "4, 6, 8, 12, 16, 20, 24, 28, 40, 48",
  radius: "sm: 6px / md: 8px / lg: 12px / xl: 100px",
  inputs: {
    height: "40px / 48px",
    width: "175px / 360px / Full",
    states: "Title / Placeholder / Info / Validation",
  },
  buttons: {
    width: "100px / 175px / 380px",
    styles: "Outline / Fill / Hover",
    radius: "6px / 10px / Full",
    text: "Size: 18px, Color: White",
  },
};

export default function SpComponentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["buttons", "inputs", "cards", "blog-cards"])
  );

  const categories = [
    "All",
    "Buttons",
    "Inputs",
    "Text",
    "Sidebar Tabs",
    "Options Menu",
    "Categories",
    "Product",
  ];

  const filteredCategories = componentCategories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold theme-heading">SP Components</h1>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 bg-transparent h-auto p-0">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className={cnTabsTriggerPill()}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-6 mb-8">
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No components found matching your search.
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <Card key={category.id} className="overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="font-semibold theme-heading">{category.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                  </div>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-5 h-5 flex items-center justify-center border-2 rounded transition-colors ${
                      isExpanded
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isExpanded ? <Check className="w-3 h-3 text-white" /> : null}
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-white">
                    {category.id === "cards" ? (
                      <ProductCardStylesPanel />
                    ) : category.id === "blog-cards" ? (
                      <BlogCardStylesPanel />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {category.components.map((component, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">{component.name}</h3>
                            <div className="flex items-start justify-center">{component.example}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <div
        className="mt-8 p-6 rounded-xl border"
        style={{
          backgroundColor: "var(--theme-light, #f5f5f5)",
          borderColor: "var(--theme-light)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border-2"
            style={{ borderColor: "var(--theme-primary)" }}
          >
            <Package className="w-6 h-6" style={{ color: "var(--theme-primary)" }} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg theme-heading mb-1">SP Standards Kit</h2>
            <p className="text-sm text-gray-600 mb-4">Developer must follow the given standards</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Sizes:</p>
                <p className="text-gray-600">+ {spStandards.sizes}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Radius:</p>
                <p className="text-gray-600">+ {spStandards.radius}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Inputs:</p>
                <p className="text-gray-600">H {spStandards.inputs.height}</p>
                <p className="text-gray-600">W {spStandards.inputs.width}</p>
                <p className="text-gray-600">{spStandards.inputs.states}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Buttons:</p>
                <p className="text-gray-600">+ {spStandards.buttons.width}</p>
                <p className="text-gray-600">{spStandards.buttons.styles}</p>
                <p className="text-gray-600">Rounded {spStandards.buttons.radius}</p>
                <p className="text-gray-600">Text size 16 color white</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
