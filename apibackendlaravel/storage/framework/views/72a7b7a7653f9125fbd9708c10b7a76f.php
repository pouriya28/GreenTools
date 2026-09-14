

<style>
    @page {
        margin: 5mm;
    }

    * {
        box-sizing: border-box;
    }

    body {
        margin: 0;
        padding: 0;
        font-family: vazirmatn, Tahoma, Arial, sans-serif;
        direction: rtl;
        text-align: right;
        font-size: 8.5pt;
        color: #111; /* مشکی ملایم برای چاپ بهتر */
    }

    .page {
        page-break-after: always;
        width: 100%;
        direction: ltr;
        padding: 2mm; 
    }

    .page:last-child {
        page-break-after: auto;
    }

    .grid {
        width: 100%;
        border-collapse: separate;
        border-spacing: 4mm; /* فاصله مناسب بین لیبل‌ها */
        table-layout: fixed;
        direction: ltr;
    }

    .grid-cell {
        width: <?php echo e($labelWidthMm); ?>mm;
        height: <?php echo e($labelHeightMm); ?>mm;
        padding: 0;
        vertical-align: top;
        direction: rtl;
    }

    .label {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        
        /* ظاهر کارتی و مدرن لیبل */
        background-color: #fff;
        border: 1px solid #d1d5db; 
        border-radius: 3mm;
        padding: 4mm 5mm;

        direction: rtl;
        text-align: right;
        line-height: 1.6;
    }

    /* استایل عناوین بخش‌ها */
    .section-title {
        font-size: 9pt; /* کمی درشت‌تر برای خوانایی بهتر */
        font-weight: bold;
        padding: 1.5mm 3mm;
        border-radius: 1.5mm;
        display: inline-block;
        margin-bottom: 5mm; /* افزایش فاصله عنوان از محتوای زیرین */
    }

    /* فرستنده - استایل روشن */
    .sender-section .section-title {
        background-color: #f3f4f6;
        color: #4b5563;
    }

    /* گیرنده - استایل تیره برای جلب توجه پستچی */
    .recipient-section .section-title {
        background-color: #1f2937;
        color: #ffffff;
    }

    .fields {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        direction: rtl;
    }

    .fields td {
        vertical-align: top;
        padding: 0 0 4mm 2mm; /* افزایش فاصله بین خطوط اطلاعات */
    }

    .fields td:last-child {
        padding-left: 0;
    }

    /* تفاوت ظاهری لیبل فیلد و مقدار آن */
    .field-label {
        font-size: 7.5pt;
        color: #6b7280;
        white-space: nowrap;
        margin-left: 1mm;
    }

    .field-value {
        font-size: 9pt;
        font-weight: 800;
        color: #000;
    }

    .recipient-name {
        font-size: 10.5pt; /* نام گیرنده کمی درشت‌تر */
        font-weight: 900;
    }

    .address {
        padding-top: 1mm;
    }

    .address-value {
        font-size: 9.5pt;
        font-weight: bold;
        line-height: 1.8;
        color: #111;
        text-align: justify;
    }

    /* خط برش تمیز و استاندارد */
    .cut-line {
        width: 100%;
        border-top: 1.5px dashed #cbd5e1;
        margin: 4.5mm 0;
        height: 0;
    }

    /* فوتر پایین لیبل */
    .label-footer {
        margin-top: auto;
        padding-top: 2.5mm;
        border-top: 1px solid #e5e7eb;
        width: 100%;
    }

    .label-footer table {
        width: 100%;
        border-collapse: collapse;
    }

    .order-id {
        font-size: 7pt;
        color: #6b7280;
        font-weight: bold;
        text-align: right;
    }

    .postal-icon {
        font-size: 10pt;
        color: #9ca3af;
        text-align: left;
    }

    .ltr-value {
        direction: ltr;
        unicode-bidi: embed;
        display: inline-block;
    }
</style>

<?php $__currentLoopData = $pages; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $page): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
    <div class="page">
        <table class="grid">
            <tr>
                <?php $__currentLoopData = $page; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $order): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php
                        $address = $order->addressSnapshot;
                    ?>

                    <td class="grid-cell" dir="rtl">
                        <div class="label">

                            
                            <div class="sender-section">
                                <div class="section-title">فرستنده :</div><br>

                                <table class="fields">
                                    <tr>
                                        <td width="50%">
                                            <span class="field-label">استان:</span>
                                            <span class="field-value"><?php echo e($sender->province_name ?: '...................'); ?></span>
                                        </td>
                                        <td width="50%">
                                            <span class="field-label">شهر:</span>
                                            <span class="field-value"><?php echo e($sender->city_name ?: '...................'); ?></span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2">
                                            <div class="address">
                                                <span class="field-label">آدرس کامل:</span>
                                                <div class="address-value">
                                                    <?php echo e($sender->address_line ?: '................................................................'); ?>

                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <span class="field-label">تلفن:</span>
                                            <span class="field-value ltr-value"><?php echo e($sender->sender_phone ?: '...........'); ?></span>
                                        </td>
                                        <td>
                                            <span class="field-label">کد پستی:</span>
                                            <span class="field-value ltr-value">................</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            
                            <div class="cut-line"></div>

                            
                            <div class="recipient-section">
                                <div class="section-title">گیرنده :</div><br>
                                
                                <table class="fields">
                                    <tr>
                                        <td colspan="2">
                                            <span class="field-label">نام و نام خانوادگی:</span>
                                            <span class="field-value recipient-name"><?php echo e($address?->recipient_name ?? '........................................'); ?></span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="50%">
                                            <span class="field-label">استان:</span>
                                            <span class="field-value"><?php echo e($address?->province_name ?? '...................'); ?></span>
                                        </td>
                                        <td width="50%">
                                            <span class="field-label">شهر:</span>
                                            <span class="field-value"><?php echo e($address?->city_name ?? '...................'); ?></span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2">
                                            <div class="address">
                                                <span class="field-label">آدرس کامل:</span>
                                                <div class="address-value">
                                                    <?php if($address?->address_line): ?>
                                                        <?php echo e($address->address_line); ?>

                                                        <?php if($address->district): ?>، <?php echo e($address->district); ?><?php endif; ?>
                                                        <?php if($address->plaque): ?>، پلاک <?php echo e($address->plaque); ?><?php endif; ?>
                                                        <?php if($address->unit): ?>، واحد <?php echo e($address->unit); ?><?php endif; ?>
                                                    <?php else: ?>
                                                        ................................................................
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <span class="field-label">تلفن:</span>
                                            <span class="field-value ltr-value"><?php echo e($address?->recipient_phone ?? '...........'); ?></span>
                                        </td>
                                        <td>
                                            <span class="field-label">کد پستی:</span>
                                            <span class="field-value ltr-value"><?php echo e($address?->postal_code ?? '...........'); ?></span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            
                            <div class="label-footer">

                            </div>

                        </div>
                    </td>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </tr>
        </table>
    </div>
<?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php /**PATH C:\Dev\GreenTools\apibackendlaravel\resources\views/labels/sheet.blade.php ENDPATH**/ ?>